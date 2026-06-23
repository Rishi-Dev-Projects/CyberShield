import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserContext, errorResponse } from '@/lib/api-utils';

export async function GET(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const user = getUserContext(req);
  if (!user) {
    return errorResponse('AUTH_TOKEN_MISSING', 'Authentication credentials missing or invalid.', 401);
  }

  const { jobId } = await params;

  try {
    const job = await db.getScanJob(jobId);
    if (!job) {
      return errorResponse('RESOURCE_NOT_FOUND', 'Vulnerability scan job not found.', 404);
    }

    // Access control check (students restricted to their own logs)
    if (user.role === 'STUDENT' && job.userId !== user.id) {
      return errorResponse('AUTH_INSUFFICIENT_PERMISSIONS', 'Insufficient permissions to view this scan job.', 403);
    }

    return NextResponse.json(job);
  } catch (err: any) {
    console.error('Error fetching vulnerability scan status:', err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to retrieve scan job status.', 500);
  }
}
