import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// GET /api/stats/calories?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/calories', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const from = req.query.from as string;
  const to = req.query.to as string;

  if (!from || !to) {
    return res.status(400).json({ success: false, error: 'Укажите параметры from и to' });
  }

  const [logs, norm] = await Promise.all([
    prisma.foodLog.findMany({
      where: { userId, date: { gte: from, lte: to } },
    }),
    prisma.dailyNorm.findFirst({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
    }),
  ]);

  const planCalories = norm?.calories || 2000;
  const byDate: Record<string, number> = {};
  logs.forEach((log) => {
    byDate[log.date] = (byDate[log.date] || 0) + log.calories;
  });

  // Fill all dates in range
  const data: { date: string; plan: number; actual: number }[] = [];
  const current = new Date(from);
  const end = new Date(to);
  while (current <= end) {
    const d = current.toISOString().split('T')[0];
    data.push({ date: d, plan: planCalories, actual: byDate[d] || 0 });
    current.setDate(current.getDate() + 1);
  }

  return res.json({ success: true, data });
});

// GET /api/stats/macros?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/macros', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const from = req.query.from as string;
  const to = req.query.to as string;

  if (!from || !to) {
    return res.status(400).json({ success: false, error: 'Укажите параметры from и to' });
  }

  const logs = await prisma.foodLog.findMany({
    where: { userId, date: { gte: from, lte: to } },
  });

  const byDate: Record<string, { proteinG: number; fatG: number; carbsG: number }> = {};
  logs.forEach((log) => {
    if (!byDate[log.date]) byDate[log.date] = { proteinG: 0, fatG: 0, carbsG: 0 };
    byDate[log.date].proteinG += log.proteinG;
    byDate[log.date].fatG += log.fatG;
    byDate[log.date].carbsG += log.carbsG;
  });

  const data: { date: string; proteinG: number; fatG: number; carbsG: number }[] = [];
  const current = new Date(from);
  const end = new Date(to);
  while (current <= end) {
    const d = current.toISOString().split('T')[0];
    data.push({ date: d, ...(byDate[d] || { proteinG: 0, fatG: 0, carbsG: 0 }) });
    current.setDate(current.getDate() + 1);
  }

  return res.json({ success: true, data });
});

// GET /api/stats/weight?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/weight', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const from = req.query.from as string;
  const to = req.query.to as string;

  const where: any = { userId };
  if (from && to) {
    where.loggedAt = { gte: new Date(from), lte: new Date(to + 'T23:59:59Z') };
  }

  const logs = await prisma.weightLog.findMany({
    where,
    orderBy: { loggedAt: 'asc' },
  });

  return res.json({ success: true, data: logs });
});

// GET /api/stats/summary
router.get('/summary', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const now = new Date();

  const d7 = new Date(now);
  d7.setDate(d7.getDate() - 7);
  const d30 = new Date(now);
  d30.setDate(d30.getDate() - 30);

  const d7str = d7.toISOString().split('T')[0];
  const d30str = d30.toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const [logs7d, logs30d, norm, user] = await Promise.all([
    prisma.foodLog.findMany({ where: { userId, date: { gte: d7str, lte: todayStr } } }),
    prisma.foodLog.findMany({ where: { userId, date: { gte: d30str, lte: todayStr } } }),
    prisma.dailyNorm.findFirst({ where: { userId }, orderBy: { calculatedAt: 'desc' } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  const sumCals = (logs: any[]) => logs.reduce((s, l) => s + l.calories, 0);
  const uniqueDays = (logs: any[]) => new Set(logs.map((l) => l.date)).size;

  const avg7d = uniqueDays(logs7d) > 0 ? Math.round(sumCals(logs7d) / uniqueDays(logs7d)) : 0;
  const avg30d = uniqueDays(logs30d) > 0 ? Math.round(sumCals(logs30d) / uniqueDays(logs30d)) : 0;

  const planCal = norm?.calories || 2000;
  const daysWithLogs = uniqueDays(logs7d);
  const completionRate = daysWithLogs > 0 ? Math.round((daysWithLogs / 7) * 100) : 0;

  // Project goal date
  let projectedGoalDate: string | null = null;
  if (user?.currentWeightKg && user.targetWeightKg && avg7d > 0 && planCal > 0) {
    const weeklyDeficit = (planCal - avg7d) * 7;
    const kgPerWeek = weeklyDeficit / 7700;
    const kgToGo = Math.abs(user.currentWeightKg - user.targetWeightKg);
    if (Math.abs(kgPerWeek) > 0.01) {
      const weeksToGo = kgToGo / Math.abs(kgPerWeek);
      const goalDate = new Date();
      goalDate.setDate(goalDate.getDate() + weeksToGo * 7);
      projectedGoalDate = goalDate.toISOString().split('T')[0];
    }
  }

  return res.json({
    success: true,
    data: {
      avgCalories7d: avg7d,
      avgCalories30d: avg30d,
      streakDays: daysWithLogs,
      completionRate,
      projectedGoalDate,
    },
  });
});

export default router;
