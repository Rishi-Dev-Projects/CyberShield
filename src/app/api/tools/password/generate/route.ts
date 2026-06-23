import { NextResponse } from 'next/server';
import { getUserContext, errorResponse, logAudit } from '@/lib/api-utils';

export async function POST(req: Request) {
  const user = getUserContext(req);
  if (!user) {
    return errorResponse('AUTH_TOKEN_MISSING', 'Authentication credentials missing or invalid.', 401);
  }

  try {
    const { 
      length = 16, 
      includeLowercase = true, 
      includeUppercase = true, 
      includeNumbers = true, 
      includeSpecialChars = true 
    } = await req.json();

    const len = Math.max(6, Math.min(64, Number(length)));

    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numberChars = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let pool = '';
    let password = '';

    // Guarantee at least one character of each selected type is present
    if (includeLowercase) {
      pool += lowercaseChars;
      password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
    }
    if (includeUppercase) {
      pool += uppercaseChars;
      password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
    }
    if (includeNumbers) {
      pool += numberChars;
      password += numberChars[Math.floor(Math.random() * numberChars.length)];
    }
    if (includeSpecialChars) {
      pool += specialChars;
      password += specialChars[Math.floor(Math.random() * specialChars.length)];
    }

    if (pool.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'At least one character definition set must be enabled.');
    }

    // Fill the rest of the password length
    const currentLen = password.length;
    for (let i = currentLen; i < len; i++) {
      password += pool[Math.floor(Math.random() * pool.length)];
    }

    // Shuffle the characters to avoid predictable starts
    const passwordArray = password.split('');
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = passwordArray[i];
      passwordArray[i] = passwordArray[j];
      passwordArray[j] = temp;
    }
    const finalPassword = passwordArray.join('');

    // Strength estimation
    let strengthScore = 0;
    strengthScore += Math.min(len * 4.5, 50); // up to 50 for length
    let poolsUsed = 0;
    if (includeLowercase) poolsUsed++;
    if (includeUppercase) poolsUsed++;
    if (includeNumbers) poolsUsed++;
    if (includeSpecialChars) poolsUsed++;
    strengthScore += poolsUsed * 12.5; // up to 50 for pool choices
    strengthScore = Math.max(0, Math.min(100, Math.round(strengthScore)));

    await logAudit(req, user.id, 'POST /api/tools/password/generate', 'PASSWORD_GENERATE', 'success');

    return NextResponse.json({
      password: finalPassword,
      strength: strengthScore
    });
  } catch (err: any) {
    console.error('Failed to generate password:', err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to generate password.', 500);
  }
}
