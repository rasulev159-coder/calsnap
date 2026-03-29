import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { foodLogCreateSchema, foodLogUpdateSchema } from '@calsnap/shared';
import { today } from '@calsnap/shared';

const router = Router();

// GET /api/logs?date=YYYY-MM-DD
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const date = (req.query.date as string) || today();
  const logs = await prisma.foodLog.findMany({
    where: { userId: req.user!.userId, date },
    orderBy: { createdAt: 'asc' },
  });
  return res.json({ success: true, data: logs });
});

// GET /api/logs/summary?date=YYYY-MM-DD
router.get('/summary', requireAuth, async (req: Request, res: Response) => {
  const date = (req.query.date as string) || today();
  const userId = req.user!.userId;

  const [logs, norm] = await Promise.all([
    prisma.foodLog.findMany({ where: { userId, date }, orderBy: { createdAt: 'asc' } }),
    prisma.dailyNorm.findFirst({ where: { userId }, orderBy: { calculatedAt: 'desc' } }),
  ]);

  const actual = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      proteinG: acc.proteinG + log.proteinG,
      fatG: acc.fatG + log.fatG,
      carbsG: acc.carbsG + log.carbsG,
    }),
    { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 },
  );

  return res.json({
    success: true,
    data: {
      date,
      plan: norm
        ? { calories: norm.calories, proteinG: norm.proteinG, fatG: norm.fatG, carbsG: norm.carbsG }
        : { calories: 2000, proteinG: 150, fatG: 67, carbsG: 225 },
      actual,
      logs,
    },
  });
});

// POST /api/logs
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = foodLogCreateSchema.parse(req.body);
    const log = await prisma.foodLog.create({
      data: { userId: req.user!.userId, ...data },
    });
    return res.status(201).json({ success: true, data: log });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: err.errors[0]?.message || 'Ошибка валидации' });
    }
    throw err;
  }
});

// PUT /api/logs/:id
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = foodLogUpdateSchema.parse(req.body);
    const log = await prisma.foodLog.updateMany({
      where: { id: req.params.id, userId: req.user!.userId },
      data,
    });
    if (log.count === 0) {
      return res.status(404).json({ success: false, error: 'Запись не найдена' });
    }
    const updated = await prisma.foodLog.findUnique({ where: { id: req.params.id } });
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: err.errors[0]?.message || 'Ошибка валидации' });
    }
    throw err;
  }
});

// DELETE /api/logs/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const result = await prisma.foodLog.deleteMany({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (result.count === 0) {
    return res.status(404).json({ success: false, error: 'Запись не найдена' });
  }
  return res.json({ success: true, data: null });
});

export default router;
