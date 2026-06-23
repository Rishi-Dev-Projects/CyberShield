import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import { getUserContext, errorResponse, logAudit } from '@/lib/api-utils';

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes('placeholder-project');
};

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

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
    return NextResponse.json({ users });
  } catch (err: any) {
    console.error('Failed to list users:', err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to retrieve users list.', 500);
  }
}

export async function POST(req: Request) {
  const user = getUserContext(req);
  if (!user) {
    return errorResponse('AUTH_TOKEN_MISSING', 'Authentication credentials missing or invalid.', 401);
  }

  if (user.role !== 'ADMIN') {
    return errorResponse('AUTH_INSUFFICIENT_PERMISSIONS', 'Insufficient permissions. Admin role required.', 403);
  }

  try {
    const { username, email, password, role = 'STUDENT' } = await req.json();

    if (!username || !email || !password) {
      return errorResponse('VALIDATION_ERROR', 'Please provide username, email, and password.');
    }

    let createdUserRecord;

    if (isSupabaseConfigured()) {
      const supabaseAdmin = getSupabaseAdmin();
      if (!supabaseAdmin) {
        return errorResponse('INTERNAL_SERVER_ERROR', 'Supabase Service Role Key missing in environment.', 500);
      }

      // 1. Create user in Supabase auth
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authErr) {
        return errorResponse('VALIDATION_ERROR', authErr.message, 400);
      }

      if (!authData.user) {
        return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to create auth record.', 500);
      }

      // 2. Create profile entry
      const { error: profileErr } = await supabaseAdmin
        .from('profiles')
        .insert([{
          id: authData.user.id,
          username,
          email,
          role,
          is_active: true
        }]);

      if (profileErr) {
        // Rollback user creation
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return errorResponse('VALIDATION_ERROR', profileErr.message, 400);
      }

      createdUserRecord = {
        id: authData.user.id,
        username,
        email,
        role,
        isActive: true,
        createdAt: new Date().toISOString()
      };
    } else {
      // Offline local database mock
      createdUserRecord = await db.adminCreateUser({ username, email, role });
    }

    await logAudit(req, user.id, `POST /api/admin/users created=${email}`, 'USER_CREATE', 'success');

    return NextResponse.json(createdUserRecord);
  } catch (err: any) {
    console.error('Failed to create user:', err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred.', 500);
  }
}
