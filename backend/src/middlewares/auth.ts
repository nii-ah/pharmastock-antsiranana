import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, Pharmacien } from '../types';

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token manquant ou invalide' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as Pharmacien;
    req.pharmacien = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token expiré ou invalide' });
  }
};
