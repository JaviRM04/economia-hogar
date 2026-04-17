import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  usuarioId?: string;
  usuarioNombre?: string;
}

export function autenticar(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      nombre: string;
    };
    req.usuarioId = payload.id;
    req.usuarioNombre = payload.nombre;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
