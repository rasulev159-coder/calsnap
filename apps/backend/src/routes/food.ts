import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/requireAuth';
import { analyzePhotoWithClaude } from '../lib/claude';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения'));
    }
  },
});

const router = Router();

// POST /api/food/analyze-photo
router.post('/analyze-photo', requireAuth, upload.single('photo'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Фото не загружено' });
  }

  try {
    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const result = await analyzePhotoWithClaude(base64, mimeType);
    const parsed = JSON.parse(result);

    // Normalize response format
    const items = parsed.items || [parsed];
    const normalized = items.map((item: any) => ({
      dishName: item.dish_name,
      confidence: item.confidence,
      portionG: item.portion_g,
      calories: item.calories,
      proteinG: item.protein_g,
      fatG: item.fat_g,
      carbsG: item.carbs_g,
      notes: item.notes || '',
    }));

    return res.json({ success: true, data: { items: normalized } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Ошибка анализа фото: ' + err.message });
  }
});

// POST /api/food/search
router.post('/search', requireAuth, async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, error: 'Введите поисковый запрос' });
  }

  // Simple local food database (expandable)
  const foods = [
    { name: 'Куриная грудка (100г)', calories: 165, proteinG: 31, fatG: 3.6, carbsG: 0, portionG: 100 },
    { name: 'Рис белый (100г)', calories: 130, proteinG: 2.7, fatG: 0.3, carbsG: 28, portionG: 100 },
    { name: 'Гречка (100г)', calories: 110, proteinG: 4.2, fatG: 1.1, carbsG: 21, portionG: 100 },
    { name: 'Яйцо куриное (1 шт)', calories: 155, proteinG: 13, fatG: 11, carbsG: 1.1, portionG: 50 },
    { name: 'Банан (1 шт)', calories: 89, proteinG: 1.1, fatG: 0.3, carbsG: 23, portionG: 120 },
    { name: 'Овсянка (100г)', calories: 68, proteinG: 2.4, fatG: 1.4, carbsG: 12, portionG: 100 },
    { name: 'Творог 5% (100г)', calories: 121, proteinG: 17, fatG: 5, carbsG: 1.8, portionG: 100 },
    { name: 'Лосось (100г)', calories: 208, proteinG: 20, fatG: 13, carbsG: 0, portionG: 100 },
    { name: 'Хлеб чёрный (1 кусок)', calories: 65, proteinG: 2.1, fatG: 0.3, carbsG: 13, portionG: 30 },
    { name: 'Молоко 2.5% (200мл)', calories: 104, proteinG: 5.6, fatG: 5, carbsG: 9.4, portionG: 200 },
    { name: 'Плов с бараниной (100г)', calories: 150, proteinG: 6, fatG: 5.8, carbsG: 18, portionG: 100 },
    { name: 'Шурпа (100г)', calories: 45, proteinG: 3.5, fatG: 2.5, carbsG: 2.8, portionG: 100 },
    { name: 'Самса с мясом (1 шт)', calories: 280, proteinG: 10, fatG: 14, carbsG: 28, portionG: 120 },
    { name: 'Лагман (100г)', calories: 85, proteinG: 4.5, fatG: 3, carbsG: 10, portionG: 100 },
    { name: 'Манты (1 шт)', calories: 180, proteinG: 8, fatG: 9, carbsG: 16, portionG: 80 },
  ];

  const q = query.toLowerCase();
  const results = foods.filter((f) => f.name.toLowerCase().includes(q));

  return res.json({ success: true, data: results });
});

export default router;
