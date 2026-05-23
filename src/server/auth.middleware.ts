import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'app-studio-super-secret-key-in-prod';

export interface AuthUser {
  role: string;
  [key: string]: unknown;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access Denied: Token missing.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, user: string | jwt.JwtPayload | undefined) => {
    if (err || !user) {
      res.status(403).json({ error: 'Access Forbidden: Invalid or expired token.' });
      return;
    }
    req.user = user as AuthUser;
    next();
  });
};

export const generateLoginToken = (): string => {
  return jwt.sign({ role: 'app-engineer' }, JWT_SECRET, { expiresIn: '24h' });
};
