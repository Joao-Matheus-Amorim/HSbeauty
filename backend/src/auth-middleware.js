import jwt from 'jsonwebtoken';
import { sendError } from './http-response.js';

export function createAuthMiddleware({ jwtSecret, jwtLib = jwt }) {
  return function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return sendError(res, 401, 'Token não fornecido');

    const token = header.slice('Bearer '.length).trim();
    if (!token) return sendError(res, 401, 'Token não fornecido');

    try {
      req.admin = jwtLib.verify(token, jwtSecret);
      next();
    } catch {
      return sendError(res, 401, 'Token inválido ou expirado');
    }
  };
}
