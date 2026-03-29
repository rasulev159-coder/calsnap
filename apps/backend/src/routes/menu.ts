import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { generateMenuWithClaude } from '../lib/claude';
import { today } from '@calsnap/shared';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

async function generateMenuForUser(userId: string, date: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const norm = await prisma.dailyNorm.findFirst({
    where: { userId },
    orderBy: { calculatedAt: 'desc' },
  });

  const calories = norm?.calories || 2000;
  const protein = norm?.proteinG || 150;
  const fat = norm?.fatG || 67;
  const carbs = norm?.carbsG || 225;

  const result = await generateMenuWithClaude(
    calories, protein, fat, carbs,
    user?.goal || 'maintain',
    user?.dietaryPreferences || [],
    user?.allergies || '',
  );

  const parsed = JSON.parse(result);
  const meals = parsed.meals.map((m: any) => ({
    id: uuidv4(),
    mealType: m.meal_type,
    foodName: m.food_name,
    calories: m.calories,
    proteinG: m.protein_g,
    fatG: m.fat_g,
    carbsG: m.carbs_g,
    recipe: m.recipe,
    isEaten: false,
  }));

  return prisma.menuPlan.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, meals },
    update: { meals, generatedAt: new Date() },
  });
}

// GET /api/menu?date=YYYY-MM-DD
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const date = (req.query.date as string) || today();
  const userId = req.user!.userId;

  let menu = await prisma.menuPlan.findUnique({
    where: { userId_date: { userId, date } },
  });

  if (!menu) {
    menu = await generateMenuForUser(userId, date);
  }

  return res.json({ success: true, data: menu });
});

// POST /api/menu/regenerate
router.post('/regenerate', requireAuth, async (req: Request, res: Response) => {
  const date = (req.body.date as string) || today();
  const menu = await generateMenuForUser(req.user!.userId, date);
  return res.json({ success: true, data: menu });
});

// PUT /api/menu/:id/eat
router.put('/:id/eat', requireAuth, async (req: Request, res: Response) => {
  const menu = await prisma.menuPlan.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!menu) return res.status(404).json({ success: false, error: 'Меню не найдено' });

  const { mealId } = req.body;
  const meals = menu.meals as any[];
  const meal = meals.find((m: any) => m.id === mealId);
  if (!meal) return res.status(404).json({ success: false, error: 'Блюдо не найдено' });

  meal.isEaten = true;

  await prisma.menuPlan.update({
    where: { id: menu.id },
    data: { meals },
  });

  // Add to food log
  await prisma.foodLog.create({
    data: {
      userId: req.user!.userId,
      date: menu.date,
      mealType: meal.mealType,
      foodName: meal.foodName,
      calories: meal.calories,
      proteinG: meal.proteinG,
      fatG: meal.fatG,
      carbsG: meal.carbsG,
      portionG: 0,
      source: 'menu',
    },
  });

  return res.json({ success: true, data: menu });
});

// PUT /api/menu/:id/skip
router.put('/:id/skip', requireAuth, async (req: Request, res: Response) => {
  const menu = await prisma.menuPlan.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!menu) return res.status(404).json({ success: false, error: 'Меню не найдено' });

  const { mealId } = req.body;
  const meals = (menu.meals as any[]).filter((m: any) => m.id !== mealId);

  await prisma.menuPlan.update({
    where: { id: menu.id },
    data: { meals },
  });

  return res.json({ success: true, data: { ...menu, meals } });
});

export default router;
