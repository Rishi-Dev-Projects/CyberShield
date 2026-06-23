import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserContext, errorResponse, logAudit } from '@/lib/api-utils';

export async function GET(req: Request) {
  const user = getUserContext(req);
  if (!user) {
    return errorResponse('AUTH_TOKEN_MISSING', 'Authentication credentials missing or invalid.', 401);
  }

  if (user.role !== 'ADMIN') {
    return errorResponse('AUTH_INSUFFICIENT_PERMISSIONS', 'Insufficient permissions. Admin role required.', 403);
  }

  try {
    const limits = await db.getRateLimits();
    return NextResponse.json({ rateLimits: limits });
  } catch (err: any) {
    console.error('Failed to get rate limits:', err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to retrieve rate limit thresholds.', 500);
  }
}

export async function PATCH(req: Request) {
  const user = getUserContext(req);
  if (!user) {
    return errorResponse('AUTH_TOKEN_MISSING', 'Authentication credentials missing or invalid.', 401);
  }

  if (user.role !== 'ADMIN') {
    return errorResponse('AUTH_INSUFFICIENT_PERMISSIONS', 'Insufficient permissions. Admin role required.', 403);
  }

  try {
    const { tool, limit, window } = await req.json();

    if (!tool || limit === undefined || window === undefined) {
      return errorResponse('VALIDATION_ERROR', 'Please provide tool, limit, and window parameters.');
    }

    await db.updateRateLimit(tool, Number(limit), Number(window));

    await logAudit(
      req, 
      user.id, 
      `PATCH /api/admin/rate-limits tool=${tool} limit=${limit} window=${window}`, 
      'RATE_LIMIT_UPDATE', 
      'success'
    );

    return NextResponse.json({ message: 'Rate limit updated successfully.' });
  } catch (err: any) {
    console.error('Failed to update rate limit:', err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to modify rate limit configuration.', 500);
  }
}
