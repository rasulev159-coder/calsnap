import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { generateWorkoutPlanWithClaude } from '../lib/claude';

const router = Router();

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

// GET /api/workout/plan
router.get('/plan', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const weekStart = getMonday(new Date());

  let plan = await prisma.workoutPlan.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  });

  if (!plan) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const result = await generateWorkoutPlanWithClaude(
      user?.goal || 'maintain',
      user?.activityLevel || 'moderate',
    );

    const parsed = JSON.parse(result);
    const workoutDays = parsed.plan.map((d: any) => ({
      day: d.day,
      exercises: d.exercises.map((e: any) => ({
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        kcalBurn: e.kcal_burn,
      })),
      isDone: false,
    }));

    plan = await prisma.workoutPlan.create({
      data: { userId, weekStart, plan: workoutDays },
    });
  }

  return res.json({ success: true, data: plan });
});

// PUT /api/workout/:day/done
router.put('/:day/done', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const weekStart = getMonday(new Date());
  const dayName = decodeURIComponent(req.params.day);

  const plan = await prisma.workoutPlan.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  });
  if (!plan) return res.status(404).json({ success: false, error: 'План тренировок не найден' });

  const days = plan.plan as any[];
  const day = days.find((d: any) => d.day === dayName);
  if (!day) return res.status(404).json({ success: false, error: 'День не найден' });

  day.isDone = true;

  await prisma.workoutPlan.update({
    where: { id: plan.id },
    data: { plan: days },
  });

  return res.json({ success: true, data: { ...plan, plan: days } });
});

export default router;
