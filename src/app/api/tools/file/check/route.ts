import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { getUserContext, errorResponse, checkRateLimit, logAudit } from '@/lib/api-utils';

export async function POST(req: Request) {
  const user = getUserContext(req);
  if (!user) {
    return errorResponse('AUTH_TOKEN_MISSING', 'Authentication credentials missing or invalid.', 401);
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return errorResponse('VALIDATION_ERROR', 'Please provide a file payload.');
    }

    const sizeLimitMB = user.role === 'STUDENT' ? 10 : 100;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > sizeLimitMB) {
      return errorResponse('VALIDATION_ERROR', `File size exceeds limit of ${sizeLimitMB}MB for your clearance role.`);
    }

    // Check rate limits
    const allowed = await checkRateLimit(req, 'file_check', user.id);
    if (!allowed) {
      await logAudit(req, user.id, `POST /api/tools/file/check filename=${file.name}`, 'FILE_CHECK', 'failure', { error: 'Rate limit exceeded' });
      return errorResponse('RATE_LIMIT_EXCEEDED', 'File check rate limit exceeded. Please try again later.', 429);
    }

    // Compute SHA-256
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // Register file hash in database
    const record = await db.createFileHash({
      filename: file.name,
      fileSize: file.size,
      sha256,
      userId: user.id
    });

    await logAudit(req, user.id, `POST /api/tools/file/check filename=${file.name} sha256=${sha256}`, 'FILE_CHECK', 'success');

    return NextResponse.json({
      filename: record.filename,
      fileSize: record.fileSize,
      sha256: record.sha256,
      timestamp: record.createdAt
    });
  } catch (err: any) {
    console.error('Failed to register file hash:', err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred during file hash check.', 500);
  }
}
export const config = {
  api: {
    bodyParser: false, // Disables standard body parsing since we handle multipart
  },
};
