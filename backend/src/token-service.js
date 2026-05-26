import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export function generateAccessToken({ admin, jwtSecret, jwtLib = jwt }) {
  return jwtLib.sign({ id: admin.id, email: admin.email }, jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export async function generateRefreshToken({ adminId, prisma, randomBytes = crypto.randomBytes, now = () => new Date() }) {
  const token = randomBytes(48).toString('hex');
  const expiresAt = now();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({ data: { token, adminId, expiresAt } });

  return token;
}
