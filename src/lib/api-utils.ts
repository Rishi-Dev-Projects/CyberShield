import { NextResponse } from 'next/server';
import { db } from './db';

export interface UserContext {
  id: string;
  role: 'ADMIN' | 'SECURITY_ANALYST' | 'STUDENT';
  username: string;
  email: string;
}

// In-memory rate limiting map as a secondary fallback
const rateLimitCache = new Map<string, number[]>();

export function getUserContext(req: Request): UserContext | null {
  const userId = req.headers.get('x-user-id');
  const role = req.headers.get('x-user-role') as any;
  const username = req.headers.get('x-user-name') || '';
  const email = req.headers.get('x-user-email') || '';

  if (!userId) return null;

  return {
    id: userId,
    role: role || 'STUDENT',
    username,
    email
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export async function checkRateLimit(req: Request, tool: string, userId: string): Promise<boolean> {
  const ip = getClientIp(req);
  const key = `${tool}:${userId || ip}`;
  
  // Get rate limits from the DB
  const limits = await db.getRateLimits();
  const config = limits.find((rl: any) => rl.tool === tool || rl.tool.replace('_', '') === tool.replace('_', ''));
  
  const limit = config ? config.limit : 50; // default count
  const windowSeconds = config ? config.window : 3600; // default 1 hour
  
  const now = Date.now();
  const timestamps = rateLimitCache.get(key) || [];
  
  // Filter out timestamps outside window
  const windowStart = now - windowSeconds * 1000;
  const validTimestamps = timestamps.filter(t => t > windowStart);
  
  if (validTimestamps.length >= limit) {
    return false;
  }
  
  validTimestamps.push(now);
  rateLimitCache.set(key, validTimestamps);
  return true;
}

export async function logAudit(
  req: Request, 
  userId: string | undefined, 
  action: string, 
  actionType: string, 
  outcome: 'success' | 'failure', 
  metadata?: any
) {
  const ip = getClientIp(req);
  await db.createAuditLog({
    userId,
    action,
    actionType,
    ipAddress: ip,
    outcome,
    metadata
  });
}

export function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        timestamp: new Date().toISOString()
      }
    },
    { status }
  );
}
