import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'app-studio-super-secret-key-in-prod';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Acesso Negado: Token não fornecido.' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Acesso Proibido: Token inválido ou expirado.' });
    req.user = user;
    next();
  });
};

export const generateLoginToken = () => {
  return jwt.sign({ role: 'app-engineer' }, JWT_SECRET, { expiresIn: '24h' });
};
