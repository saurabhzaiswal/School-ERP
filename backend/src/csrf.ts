import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

export function csrfForSession(session: string): string {
  return createHmac('sha256', process.env.SESSION_SECRET!)
    .update(`csrf:${session}`)
    .digest('base64url');
}

export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (
    ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ||
    (req.method === 'POST' && req.path === '/api/auth/login')
  )
    return next();
  if (!req.session?.userId) return next(); // Authentication returns 401 for missing sessions.
  const expected = Buffer.from(csrfForSession(req.sessionID));
  const supplied = Buffer.from(String(req.headers['x-csrf-token'] ?? ''));
  if (
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied)
  ) {
    res.status(403).json({ statusCode: 403, message: 'Invalid CSRF token' });
    return;
  }
  next();
}
