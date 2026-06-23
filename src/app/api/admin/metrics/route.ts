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
    const users = await db.listUsers();
    const totalUsers = users.length;
    const activeUsers = users.filter((u: any) => u.isActive).length;

    return NextResponse.json({
      totalUsers,
      activeUsers,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Failed to get admin metrics:', err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to retrieve administrator metrics.', 500);
  }
}
