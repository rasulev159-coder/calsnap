import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/requireAuth';
import { analyzePhotoWithClaude, MOCK_MODE } from '../lib/claude';
import { FOODS_DATABASE, type FoodItem } from '../data/foods';

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
    console.log('AI raw response:', result.substring(0, 500));

    let parsed: any;
    try {
      parsed = JSON.parse(result);
    } catch {
      // Try to extract JSON from text
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

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
    console.error('Photo analysis error:', err.message || err);
    // Fallback to demo if API fails (no credits, rate limit, etc.)
    return res.json({
      success: true,
      data: {
        items: [{
          dishName: 'Не удалось распознать',
          confidence: 0,
          portionG: 0,
          calories: 0,
          proteinG: 0,
          fatG: 0,
          carbsG: 0,
          notes: 'ИИ-анализ временно недоступен. Добавьте блюдо вручную.',
        }],
      },
    });
  }
});

/**
 * Synonym/keyword map for common food categories.
 * Allows "суп" to match soups, "мясо" to match meat dishes, etc.
 */
const SYNONYMS: Record<string, string[]> = {
  суп: ['борщ', 'щи', 'солянка', 'уха', 'рассольник', 'окрошка', 'шурпа', 'мастава', 'том ям', 'рамен'],
  мясо: ['говядина', 'свинина', 'баранина', 'телятина', 'кролик', 'утка', 'куриная', 'куриное', 'куриные', 'индейка'],
  рыба: ['лосось', 'сёмга', 'форель', 'тунец', 'треска', 'минтай', 'скумбрия', 'сельдь'],
  каша: ['овсянка', 'гречка', 'перловка', 'пшено', 'булгур', 'киноа', 'манная', 'рисовая'],
  выпечка: ['самса', 'сомса', 'блины', 'оладьи', 'круассан', 'лепёшка', 'лаваш', 'пахлава'],
  напиток: ['чай', 'кофе', 'сок', 'компот', 'кола', 'айран', 'капучино', 'латте', 'молоко', 'кефир'],
  сладкое: ['шоколад', 'мороженое', 'торт', 'печенье', 'зефир', 'халва', 'мёд', 'варенье', 'пахлава'],
  фрукт: ['яблоко', 'банан', 'апельсин', 'груша', 'виноград', 'арбуз', 'персик', 'манго', 'киви', 'ананас', 'клубника'],
  овощ: ['помидор', 'огурец', 'морковь', 'капуста', 'брокколи', 'перец', 'свёкла', 'баклажан', 'кабачок', 'тыква', 'шпинат'],
  орех: ['грецкие', 'миндаль', 'фундук', 'кешью', 'арахис'],
  фастфуд: ['бургер', 'пицца', 'хот-дог', 'шаурма', 'наггетсы', 'картофель фри', 'чипсы'],
  завтрак: ['овсянка', 'омлет', 'яичница', 'тост', 'мюсли', 'гранола', 'блины', 'сырники', 'каша'],
};

/**
 * Get word stems (prefixes of 3+ chars) for fuzzy matching.
 * Handles Russian morphology simply: "куриная" → "кур", "курин"
 */
function getStems(word: string): string[] {
  if (word.length < 3) return []; // skip short words like "с", "в", "на"
  if (word.length <= 3) return [word]; // 3-char words used as-is, no shorter stems
  const stems: string[] = [word];
  // Add prefixes from 4 chars up to full word (skip 3-char stems to avoid noise)
  for (let i = 4; i < word.length; i++) {
    stems.push(word.slice(0, i));
  }
  return stems;
}

/**
 * Smart search with fuzzy matching, stem matching, and scoring.
 */
function searchFoods(query: string, limit = 20): FoodItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const words = q.split(/\s+/).filter(Boolean);
  const queryStems = words.flatMap(getStems);

  // Expand synonyms: "суп" → also search for "борщ", "щи", etc.
  const synonymMatches = new Set<string>();
  for (const word of words) {
    const syns = SYNONYMS[word];
    if (syns) {
      syns.forEach((s) => synonymMatches.add(s));
    }
    // Also check if query is a key by stem
    for (const [key, syns] of Object.entries(SYNONYMS)) {
      if (key.startsWith(word) || word.startsWith(key)) {
        syns.forEach((s) => synonymMatches.add(s));
      }
    }
  }

  const scored = FOODS_DATABASE.map((food) => {
    const name = food.name.toLowerCase();
    const nameWords = name.split(/[\s(),/]+/).filter(Boolean);
    let score = 0;

    // Exact full match
    if (name === q) score += 100;

    // Name starts with query
    if (name.startsWith(q)) score += 50;

    // Name includes full query
    if (name.includes(q)) score += 30;

    // Each word direct match (skip short prepositions)
    for (const word of words) {
      if (word.length >= 3 && name.includes(word)) score += 15;
    }

    // Stem matching: "кур" matches "куриная", "курица" etc.
    for (const stem of queryStems) {
      if (stem.length >= 3) {
        for (const nw of nameWords) {
          if (nw.startsWith(stem)) {
            score += Math.max(Math.min(stem.length, 8), 5); // min 5 per stem match
          }
        }
      }
    }

    // Reverse stem: search within food name words against query
    for (const nw of nameWords) {
      if (nw.length < 3) continue;
      for (const word of words) {
        if (word.length < 3) continue;
        if (nw.startsWith(word) || word.startsWith(nw)) {
          score += 5;
        }
      }
    }

    // Synonym match: "суп" → matches "борщ", "шурпа", etc.
    // Match against whole words only to avoid "уха" matching "сухари"
    if (synonymMatches.size > 0) {
      for (const syn of synonymMatches) {
        for (const nw of nameWords) {
          if (nw === syn || nw.startsWith(syn) && syn.length >= 4) {
            score += 20;
            break;
          }
        }
      }
    }

    return { food, score };
  });

  const minScore = 5;
  return scored
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.food);
}

// POST /api/food/search
router.post('/search', requireAuth, async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, error: 'Введите поисковый запрос' });
  }

  const results = searchFoods(query);

  // Format response
  const formatted = results.map((f) => ({
    name: f.name,
    calories: f.calories,
    proteinG: f.proteinG,
    fatG: f.fatG,
    carbsG: f.carbsG,
    portionG: f.portionG,
    category: f.category,
  }));

  return res.json({ success: true, data: formatted });
});

export default router;
