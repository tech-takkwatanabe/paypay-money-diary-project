import { Context, Next } from 'hono';
import { verifyAccessToken } from '@/infrastructure/auth/jwt';

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
};
