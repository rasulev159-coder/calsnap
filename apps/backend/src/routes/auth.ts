import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword, generateTokens, verifyRefresh } from '../lib/auth';
import { registerSchema, loginSchema } from '@calsnap/shared';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email уже зарегистрирован' });
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: { email: data.email, passwordHash, name: data.name },
    });

    const tokens = generateTokens({ userId: user.id, email: user.email });
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, onboardingCompleted: user.onboardingCompleted },
        tokens,
      },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: err.errors[0]?.message || 'Ошибка валидации' });
    }
    throw err;
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, error: 'Неверный email или пароль' });
    }

    const valid = await comparePassword(data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Неверный email или пароль' });
    }

    const tokens = generateTokens({ userId: user.id, email: user.email });
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id, email: user.email, name: user.name,
          gender: user.gender, age: user.age, heightCm: user.heightCm,
          currentWeightKg: user.currentWeightKg, targetWeightKg: user.targetWeightKg,
          activityLevel: user.activityLevel, goal: user.goal,
          dietaryPreferences: user.dietaryPreferences, allergies: user.allergies,
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt, updatedAt: user.updatedAt,
        },
        tokens,
      },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: err.errors[0]?.message || 'Ошибка валидации' });
    }
    throw err;
  }
});

// POST /api/auth/google
router.post('/google', async (req: Request, res: Response) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ success: false, error: 'Google credential отсутствует' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(400).json({ success: false, error: 'Невалидный Google токен' });
    }

    const { email, name, sub: googleId } = payload;

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email, name: name || email.split('@')[0], googleId },
      });
    } else if (!user.googleId) {
      // Link Google to existing email account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    }

    const tokens = generateTokens({ userId: user.id, email: user.email });
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id, email: user.email, name: user.name,
          gender: user.gender, age: user.age, heightCm: user.heightCm,
          currentWeightKg: user.currentWeightKg, targetWeightKg: user.targetWeightKg,
          activityLevel: user.activityLevel, goal: user.goal,
          dietaryPreferences: user.dietaryPreferences, allergies: user.allergies,
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt, updatedAt: user.updatedAt,
        },
        tokens,
      },
    });
  } catch (err: any) {
    return res.status(401).json({ success: false, error: 'Ошибка Google авторизации: ' + err.message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Refresh token не найден' });
  }

  try {
    const payload = verifyRefresh(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Пользователь не найден' });
    }

    const tokens = generateTokens({ userId: user.id, email: user.email });
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, data: { tokens } });
  } catch {
    return res.status(401).json({ success: false, error: 'Недействительный refresh token' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Требуется авторизация' });
  }

  try {
    const { verifyAccess } = require('../lib/auth');
    const payload = verifyAccess(header.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    return res.json({
      success: true,
      data: {
        id: user.id, email: user.email, name: user.name,
        gender: user.gender, age: user.age, heightCm: user.heightCm,
        currentWeightKg: user.currentWeightKg, targetWeightKg: user.targetWeightKg,
        activityLevel: user.activityLevel, goal: user.goal,
        dietaryPreferences: user.dietaryPreferences, allergies: user.allergies,
        onboardingCompleted: user.onboardingCompleted,
        createdAt: user.createdAt, updatedAt: user.updatedAt,
      },
    });
  } catch {
    return res.status(401).json({ success: false, error: 'Недействительный токен' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  return res.json({ success: true, data: null });
});

export default router;
