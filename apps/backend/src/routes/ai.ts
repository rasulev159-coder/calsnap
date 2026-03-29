import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { chatWithClaude, generateWeeklyReportWithClaude } from '../lib/claude';
import { prisma } from '../lib/prisma';
import { chatMessageSchema } from '@calsnap/shared';

const router = Router();

// POST /api/ai/chat
router.post('/chat', requireAuth, async (req: Request, res: Response) => {
  try {
    const { message } = chatMessageSchema.parse(req.body);
    const userId = req.user!.userId;

    // Build user context
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const norm = await prisma.dailyNorm.findFirst({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
    });

    const context = `Пользователь: ${user?.name}, цель: ${user?.goal}, норма: ${norm?.calories} ккал, Б:${norm?.proteinG}г Ж:${norm?.fatG}г У:${norm?.carbsG}г`;

    const reply = await chatWithClaude(message, context);
    return res.json({ success: true, data: { role: 'assistant', content: reply } });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Введите сообщение' });
    }
    throw err;
  }
});

// GET /api/ai/weekly-report
router.get('/weekly-report', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const context = `Пользователь: ${user?.name}, цель: ${user?.goal}`;

  const result = await generateWeeklyReportWithClaude(context);

  try {
    const parsed = JSON.parse(result);
    return res.json({ success: true, data: parsed });
  } catch {
    return res.json({ success: true, data: { summary: result, positives: [], improvements: [], tip: '' } });
  }
});

export default router;
