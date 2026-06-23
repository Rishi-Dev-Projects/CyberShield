import { NextResponse } from 'next/server';
import { getUserContext, errorResponse, logAudit } from '@/lib/api-utils';

export async function POST(req: Request) {
  const user = getUserContext(req);
  if (!user) {
    return errorResponse('AUTH_TOKEN_MISSING', 'Authentication credentials missing or invalid.', 401);
  }

  try {
    const { password } = await req.json();

    if (password === undefined || password === null) {
      return errorResponse('VALIDATION_ERROR', 'Please provide a password string.');
    }

    const pwd = String(password);
    const length = pwd.length;
    const hasLowercase = /[a-z]/.test(pwd);
    const hasUppercase = /[A-Z]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    const hasSpecialChars = /[^A-Za-z0-9]/.test(pwd);

    // Check dictionary words
    const dictionaryList = [
      'password', 'admin', 'admin123', 'qwerty', '123456', '12345678', '123456789',
      'welcome', 'letmein', 'security', 'cybershield', 'shield', 'root', 'analyst',
      'student', 'cisco', 'password123', 'dragon'
    ];
    const isDictionaryWord = dictionaryList.includes(pwd.toLowerCase());

    // Check common keyboard or digit sequences
    const commonPatterns = ['123', 'abc', 'qwe', 'asd', 'zxc', '789', 'password'];
    const hasCommonPatterns = commonPatterns.some(pat => pwd.toLowerCase().includes(pat));

    // Feedback accumulator
    const feedback: string[] = [];
    if (length < 8) {
      feedback.push('Increase password length to at least 8 characters (12+ recommended).');
    } else if (length < 12) {
      feedback.push('Length is acceptable, but 12+ characters significantly improves resistance to brute forcing.');
    }

    if (!hasLowercase) feedback.push('Add lowercase characters to diversify character space.');
    if (!hasUppercase) feedback.push('Add uppercase characters.');
    if (!hasNumbers) feedback.push('Include at least one numerical digit.');
    if (!hasSpecialChars) feedback.push('Include at least one special character symbol (e.g., @, #, $, %).');
    if (isDictionaryWord) feedback.push('Avoid using common dictionary words or default credentials.');
    if (hasCommonPatterns && !isDictionaryWord) feedback.push('Avoid sequential keystrokes or predictable repeating patterns.');

    // Calculate score
    let score = 0;
    // Length points (up to 40)
    score += Math.min(length * 3.5, 40);
    // Complexity mix points (up to 60)
    if (hasLowercase) score += 15;
    if (hasUppercase) score += 15;
    if (hasNumbers) score += 15;
    if (hasSpecialChars) score += 15;

    // Deduct for weaknesses
    if (isDictionaryWord) score -= 50;
    if (hasCommonPatterns) score -= 20;

    // Clamp score 0 - 100
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Strength category
    let strength = 'Strong';
    if (score < 25) strength = 'Very Weak';
    else if (score < 50) strength = 'Weak';
    else if (score < 80) strength = 'Moderate';

    await logAudit(req, user.id, 'POST /api/tools/password/analyze', 'PASSWORD_ANALYZE', 'success');

    return NextResponse.json({
      score,
      strength,
      feedback: feedback.length > 0 ? feedback : ['Your security password matches high strength requirements.'],
      breakdown: {
        length,
        hasLowercase,
        hasUppercase,
        hasNumbers,
        hasSpecialChars,
        hasCommonPatterns,
        isDictionaryWord
      }
    });
  } catch (err: any) {
    console.error('Failed to analyze password:', err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to analyze password.', 500);
  }
}
