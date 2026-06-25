import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { getUserContext, errorResponse, checkRateLimit, logAudit } from '@/lib/api-utils';

async function getStoredHashByFilename(filename: string) {
  return db.getFileHashByFilename(filename);
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
