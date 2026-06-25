import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';
import { getUserContext, errorResponse, checkRateLimit, logAudit } from '@/lib/api-utils';

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes('placeholder-project');
};

async function getStoredHashByFilename(filename: string) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('file_hashes')
        .select('*')
        .eq('filename', filename)
        .order('createdAt', { ascending: false })
        .limit(1);
      if (!error && data && data.length > 0) return data[0];
    } catch (e) {
      console.error('Supabase query failed for file verify:', e);
    }
  }

  // Fallback to local JSON database search
  const dbPath = path.join(process.cwd(), 'cybershield-db.json');
  if (fs.existsSync(dbPath)) {
    try {
      const localDb = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      const hashes = localDb.file_hashes || [];
      const match = hashes
        .filter((h: any) => h && h.filename === filename)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (match.length > 0) return match[0];
    } catch (e) {
      console.error('Failed to read local DB for file verify:', e);
    }
  }
  return null;
}

export async function POST(req: Request) {
  const user = getUserContext(req);
  if (!user) {
    return errorResponse('AUTH_TOKEN_MISSING', 'Authentication credentials missing or invalid.', 401);
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file || !file.name) {
      return errorResponse('VALIDATION_ERROR', 'Please provide a file payload with a valid filename.');
    }

    const sizeLimitMB = user.role === 'STUDENT' ? 10 : 100;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > sizeLimitMB) {
      return errorResponse('VALIDATION_ERROR', `File size exceeds limit of ${sizeLimitMB}MB for your clearance role.`);
    }

    // Rate limiting check
    const allowed = await checkRateLimit(req, 'file_check', user.id);
    if (!allowed) {
      await logAudit(req, user.id, `POST /api/tools/file/verify filename=${file.name}`, 'FILE_VERIFY', 'failure', { error: 'Rate limit exceeded' });
      return errorResponse('RATE_LIMIT_EXCEEDED', 'File integrity rate limit exceeded. Please try again later.', 429);
    }

    // Compute SHA-256
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // Retrieve stored hash
    const storedRecord = await getStoredHashByFilename(file.name);

    if (!storedRecord) {
      await logAudit(req, user.id, `POST /api/tools/file/verify filename=${file.name} (unregistered)`, 'FILE_VERIFY', 'failure');
      return NextResponse.json({
        verified: false,
        currentHash: sha256,
        storedHash: null,
        storedAt: null,
        message: 'File not registered in integrity database. Check & register first.'
      });
    }

    const isMatch = storedRecord.filename === file.name && storedRecord.sha256 === sha256;
    const message = isMatch
      ? 'File integrity verified - file matches stored hash'
      : 'Alert: Hash mismatch! The file has been modified or tampered with.';

    await logAudit(
      req, 
      user.id, 
      `POST /api/tools/file/verify filename=${file.name} match=${isMatch}`, 
      'FILE_VERIFY', 
      isMatch ? 'success' : 'failure',
      { currentHash: sha256, storedHash: storedRecord.sha256 }
    );

    return NextResponse.json({
      verified: isMatch,
      currentHash: sha256,
      storedHash: storedRecord.sha256,
      storedAt: storedRecord.createdAt,
      message
    });
  } catch (err: any) {
    console.error('Failed to verify file integrity:', err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred during integrity verification.', 500);
  }
}
export const config = {
  api: {
    bodyParser: false,
  },
};
