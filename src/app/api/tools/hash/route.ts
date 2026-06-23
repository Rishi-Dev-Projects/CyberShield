import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUserContext, errorResponse, logAudit } from '@/lib/api-utils';

export async function POST(req: Request) {
  const user = getUserContext(req);
  if (!user) {
    return errorResponse('AUTH_TOKEN_MISSING', 'Authentication credentials missing or invalid.', 401);
  }

  try {
    const { input } = await req.json();

    if (input === undefined || input === null) {
      return errorResponse('VALIDATION_ERROR', 'Please provide a valid input string.');
    }

    const inputStr = String(input);
    const md5 = crypto.createHash('md5').update(inputStr).digest('hex');
    const sha1 = crypto.createHash('sha1').update(inputStr).digest('hex');
    const sha256 = crypto.createHash('sha256').update(inputStr).digest('hex');
    const sha512 = crypto.createHash('sha512').update(inputStr).digest('hex');

    await logAudit(req, user.id, 'POST /api/tools/hash', 'HASH_GENERATE', 'success');

    return NextResponse.json({
      md5,
      sha1,
      sha256,
      sha512,
      metadata: {
        inputLength: inputStr.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.error('Failed to generate hashes:', err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to generate hashes.', 500);
  }
}
