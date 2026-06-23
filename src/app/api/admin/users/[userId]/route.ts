import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserContext, errorResponse, logAudit } from '@/lib/api-utils';

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const admin = getUserContext(req);
  if (!admin) {
    return errorResponse('AUTH_TOKEN_MISSING', 'Authentication credentials missing or invalid.', 401);
  }

  if (admin.role !== 'ADMIN') {
    return errorResponse('AUTH_INSUFFICIENT_PERMISSIONS', 'Insufficient permissions. Admin role required.', 403);
  }

  const { userId } = await params;

  try {
    const { role, isActive } = await req.json();

    await db.adminUpdateUser(userId, { role, isActive });

    await logAudit(
      req, 
      admin.id, 
      `PATCH /api/admin/users/${userId} role=${role || '-'} isActive=${isActive !== undefined ? isActive : '-'}`, 
      'USER_UPDATE', 
      'success'
    );

    return NextResponse.json({ message: 'User updated successfully.' });
  } catch (err: any) {
    console.error('Failed to update user:', err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to update user record.', 500);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const admin = getUserContext(req);
  if (!admin) {
    return errorResponse('AUTH_TOKEN_MISSING', 'Authentication credentials missing or invalid.', 401);
  }

  if (admin.role !== 'ADMIN') {
    return errorResponse('AUTH_INSUFFICIENT_PERMISSIONS', 'Insufficient permissions. Admin role required.', 403);
  }

  const { userId } = await params;

  try {
    // Invalidate/deactivate the user
    await db.adminUpdateUser(userId, { isActive: false });

    await logAudit(req, admin.id, `DELETE /api/admin/users/${userId} (deactivate)`, 'USER_DEACTIVATE', 'success');

    return NextResponse.json({ message: 'User deactivated successfully.' });
  } catch (err: any) {
    console.error('Failed to deactivate user:', err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to deactivate user account.', 500);
  }
}
