import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { onboardingSchema, profileUpdateSchema, weightLogSchema } from '@calsnap/shared';
import { calculateDailyNorms } from '@calsnap/shared';

const router = Router();

// GET /api/profile
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ success: false, error: 'Пользователь не найден' });

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
});

// PUT /api/profile (also handles onboarding completion)
router.put('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const current = await prisma.user.findUnique({ where: { id: userId } });
    if (!current) return res.status(404).json({ success: false, error: 'Пользователь не найден' });

    const isOnboarding = !current.onboardingCompleted;
    const data = isOnboarding
      ? onboardingSchema.parse(req.body)
      : profileUpdateSchema.parse(req.body);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        onboardingCompleted: true,
      },
    });

    // Recalculate daily norms
    if (updated.gender && updated.currentWeightKg && updated.heightCm && updated.age && updated.activityLevel && updated.goal) {
      const norms = calculateDailyNorms(
        updated.gender as any,
        updated.currentWeightKg,
        updated.heightCm,
        updated.age,
        updated.activityLevel as any,
        updated.goal as any,
      );

      await prisma.dailyNorm.create({
        data: {
          userId,
          calories: norms.calories,
          proteinG: norms.proteinG,
          fatG: norms.fatG,
          carbsG: norms.carbsG,
        },
      });
    }

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: err.errors[0]?.message || 'Ошибка валидации' });
    }
    throw err;
  }
});

// GET /api/profile/norms
router.get('/norms', requireAuth, async (req: Request, res: Response) => {
  const norm = await prisma.dailyNorm.findFirst({
    where: { userId: req.user!.userId },
    orderBy: { calculatedAt: 'desc' },
  });

  if (!norm) {
    return res.status(404).json({ success: false, error: 'Нормы не рассчитаны. Заполните профиль.' });
  }

  return res.json({ success: true, data: norm });
});

// POST /api/profile/weight
router.post('/weight', requireAuth, async (req: Request, res: Response) => {
  try {
    const { weightKg } = weightLogSchema.parse(req.body);
    const userId = req.user!.userId;

    const log = await prisma.weightLog.create({
      data: { userId, weightKg },
    });

    // Update current weight in profile
    await prisma.user.update({
      where: { id: userId },
      data: { currentWeightKg: weightKg },
    });

    return res.status(201).json({ success: true, data: log });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: err.errors[0]?.message || 'Ошибка валидации' });
    }
    throw err;
  }
});

// GET /api/profile/weight
router.get('/weight', requireAuth, async (req: Request, res: Response) => {
  const logs = await prisma.weightLog.findMany({
    where: { userId: req.user!.userId },
    orderBy: { loggedAt: 'desc' },
    take: 90,
  });

  return res.json({ success: true, data: logs });
});

export default router;
