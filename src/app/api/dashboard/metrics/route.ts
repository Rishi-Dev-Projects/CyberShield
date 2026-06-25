import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserContext, errorResponse } from '@/lib/api-utils';

export async function GET(req: Request) {
  const user = getUserContext(req);
  if (!user) {
    return errorResponse('AUTH_TOKEN_MISSING', 'Authentication credentials missing or invalid.', 401);
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    // Filter metrics to only show the logged-in user's scans
    const userIdFilter = user.id;

    const [scansLast30Days, activeJobs, criticalVulnerabilities, recentScans] = await Promise.all([
      db.getScansCount(thirtyDaysAgo, userIdFilter),
      db.getActiveJobsCount(userIdFilter),
      db.getCriticalVulnerabilitiesCount(thirtyDaysAgo, userIdFilter),
      db.getRecentScans(5, userIdFilter)
    ]);

    return NextResponse.json({
      scansLast30Days,
      activeJobs,
      criticalVulnerabilities,
      recentScans
    });
  } catch (err: any) {
    console.error('Failed to load metrics:', err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to retrieve dashboard metrics.', 500);
  }
}
