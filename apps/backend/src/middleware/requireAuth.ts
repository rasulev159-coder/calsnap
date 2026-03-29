import { Request, Response, NextFunction } from 'express';
import { verifyAccess, TokenPayload } from '../lib/auth';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Требуется авторизация' });
  }

  try {
    const token = header.slice(7);
    req.user = verifyAccess(token);
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Недействительный токен' });
  }
}
