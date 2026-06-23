import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserContext, errorResponse } from '@/lib/api-utils';

export async function GET(req: Request) {
  const user = getUserContext(req);
  if (!user) {
    return errorResponse('AUTH_TOKEN_MISSING', 'Authentication credentials missing or invalid.', 401);
  }

  if (user.role !== 'ADMIN') {
    return errorResponse('AUTH_INSUFFICIENT_PERMISSIONS', 'Insufficient permissions. Admin role required.', 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));
    const outcome = searchParams.get('outcome') || undefined;
    const actionType = searchParams.get('actionType') || undefined;

    const { logs, total } = await db.getAuditLogs({
      limit,
      offset,
      outcome,
      actionType
    });

    return NextResponse.json({
      logs,
      total,
      limit,
      offset
    });
  } catch (err: any) {
    console.error('Failed to query audit logs:', err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to query system audit trails.', 500);
  }
}
