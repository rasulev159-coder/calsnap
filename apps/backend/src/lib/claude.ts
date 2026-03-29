import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Clients ─────────────────────────────────────────────
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const hasAI = !!(anthropic || gemini);

// ── Photo Analysis ──────────────────────────────────────
export async function analyzePhotoWithClaude(
  imageBase64: string,
  mimeType: string,
): Promise<string> {
  // Try Gemini first (free), then Claude, then mock
  if (gemini) {
    return analyzeWithGemini(imageBase64, mimeType);
  }
  if (anthropic) {
    return analyzeWithAnthropic(imageBase64, mimeType);
  }
  return mockPhotoResponse();
}

async function analyzeWithGemini(imageBase64: string, mimeType: string): Promise<string> {
  const model = gemini!.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await model.generateContent([
    {
      inlineData: { mimeType, data: imageBase64 },
    },
    {
      text: 'Определи что на фото. Если это еда — рассчитай КБЖУ на стандартную порцию. Если несколько блюд — верни массив. Если это НЕ еда — укажи dish_name: "Это не еда" с нулевыми значениями. Названия блюд на русском. Верни ТОЛЬКО JSON без markdown: { "items": [{ "dish_name": "...", "confidence": 0.0-1.0, "portion_g": N, "calories": N, "protein_g": N, "fat_g": N, "carbs_g": N, "notes": "..." }] }',
    },
  ]);

  const text = result.response.text();
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

async function analyzeWithAnthropic(imageBase64: string, mimeType: string): Promise<string> {
  const response = await anthropic!.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: 'Ты диетолог и эксперт по питанию. Анализируй изображения и возвращай ТОЛЬКО JSON без markdown. Если на фото не еда — верни dish_name: "Это не еда" и нулевые значения.',
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType as any, data: imageBase64 } },
        { type: 'text', text: 'Определи что на фото. Если еда — рассчитай КБЖУ. Верни JSON: { "items": [{ "dish_name": "...", "confidence": 0.0-1.0, "portion_g": N, "calories": N, "protein_g": N, "fat_g": N, "carbs_g": N, "notes": "..." }] }' },
      ],
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

function mockPhotoResponse(): string {
  return JSON.stringify({
    items: [{
      dish_name: 'Демо-режим',
      confidence: 0,
      portion_g: 0,
      calories: 0,
      protein_g: 0,
      fat_g: 0,
      carbs_g: 0,
      notes: 'Добавьте GEMINI_API_KEY или ANTHROPIC_API_KEY для распознавания фото',
    }],
  });
}

// ── Menu Generation ─────────────────────────────────────
export async function generateMenuWithClaude(
  calories: number,
  protein: number,
  fat: number,
  carbs: number,
  goal: string,
  preferences: string[],
  allergies: string,
): Promise<string> {
  const prompt = `Норма: ${calories} ккал, Б:${protein}г Ж:${fat}г У:${carbs}г. Цель: ${goal}. ${preferences.length ? 'Предпочтения: ' + preferences.join(', ') + '.' : ''} ${allergies ? 'Аллергии: ' + allergies + '.' : ''}\n\nСоставь меню на день: завтрак, обед, ужин, 1 перекус. ТОЛЬКО JSON: { "meals": [{ "meal_type": "breakfast|lunch|dinner|snack", "food_name": "...", "calories": N, "protein_g": N, "fat_g": N, "carbs_g": N, "recipe": "2-3 шага" }] }`;

  if (gemini) {
    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }

  if (anthropic) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: 'Ты персональный диетолог. Возвращай ТОЛЬКО JSON без markdown.',
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }

  // Mock
  return JSON.stringify({
    meals: [
      { meal_type: 'breakfast', food_name: 'Овсянка с бананом и орехами', calories: Math.round(calories * 0.25), protein_g: Math.round(protein * 0.2), fat_g: Math.round(fat * 0.2), carbs_g: Math.round(carbs * 0.3), recipe: 'Залить 60г овсянки кипятком, добавить банан и орехи.' },
      { meal_type: 'lunch', food_name: 'Куриная грудка с гречкой', calories: Math.round(calories * 0.35), protein_g: Math.round(protein * 0.4), fat_g: Math.round(fat * 0.25), carbs_g: Math.round(carbs * 0.3), recipe: 'Запечь 150г грудки, отварить 80г гречки, подать с салатом.' },
      { meal_type: 'dinner', food_name: 'Рыба с рисом и овощами', calories: Math.round(calories * 0.3), protein_g: Math.round(protein * 0.3), fat_g: Math.round(fat * 0.35), carbs_g: Math.round(carbs * 0.3), recipe: 'Запечь 150г рыбы, отварить 70г риса, овощи на пару.' },
      { meal_type: 'snack', food_name: 'Йогурт с ягодами', calories: Math.round(calories * 0.1), protein_g: Math.round(protein * 0.1), fat_g: Math.round(fat * 0.2), carbs_g: Math.round(carbs * 0.1), recipe: 'Греческий йогурт 200г с горстью свежих ягод.' },
    ],
  });
}

// ── Chat ─────────────────────────────────────────────────
export async function chatWithClaude(
  message: string,
  userContext: string,
): Promise<string> {
  const prompt = `Контекст: ${userContext}\n\nВопрос пользователя: ${message}`;

  if (gemini) {
    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(`Ты персональный диетолог-помощник. Отвечай кратко на русском.\n\n${prompt}`);
    return result.response.text();
  }

  if (anthropic) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `Ты персональный диетолог-помощник. Отвечай кратко на русском.`,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  return 'ИИ-помощник в демо-режиме. Добавьте API ключ для полноценной работы.';
}

// ── Weekly Report ────────────────────────────────────────
export async function generateWeeklyReportWithClaude(
  userContext: string,
): Promise<string> {
  const prompt = `${userContext}\n\nСоставь еженедельный отчёт. ТОЛЬКО JSON: { "summary": "...", "positives": ["..."], "improvements": ["..."], "tip": "..." }`;

  if (gemini) {
    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(`Ты диетолог.\n\n${prompt}`);
    return result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }

  if (anthropic) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: 'Ты диетолог. Верни ТОЛЬКО JSON.',
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }

  return JSON.stringify({ summary: 'Демо-режим', positives: [], improvements: [], tip: 'Добавьте API ключ.' });
}

// ── Workout Plan ─────────────────────────────────────────
export async function generateWorkoutPlanWithClaude(
  goal: string,
  activityLevel: string,
): Promise<string> {
  const prompt = `Цель: ${goal}. Активность: ${activityLevel}.\n\nСоставь план тренировок на 3 дня. ТОЛЬКО JSON: { "plan": [{ "day": "...", "exercises": [{ "name": "...", "sets": N, "reps": N, "kcal_burn": N }] }] }`;

  if (gemini) {
    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(`Ты фитнес-тренер.\n\n${prompt}`);
    return result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }

  if (anthropic) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: 'Ты фитнес-тренер. Верни ТОЛЬКО JSON.',
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }

  return JSON.stringify({
    plan: [
      { day: 'Понедельник', exercises: [{ name: 'Приседания', sets: 3, reps: 15, kcal_burn: 80 }, { name: 'Отжимания', sets: 3, reps: 12, kcal_burn: 60 }, { name: 'Планка', sets: 3, reps: 45, kcal_burn: 40 }] },
      { day: 'Среда', exercises: [{ name: 'Выпады', sets: 3, reps: 12, kcal_burn: 70 }, { name: 'Берпи', sets: 3, reps: 10, kcal_burn: 90 }, { name: 'Скручивания', sets: 3, reps: 20, kcal_burn: 50 }] },
      { day: 'Пятница', exercises: [{ name: 'Становая тяга', sets: 3, reps: 10, kcal_burn: 100 }, { name: 'Подтягивания', sets: 3, reps: 8, kcal_burn: 70 }, { name: 'Велосипед', sets: 3, reps: 20, kcal_burn: 50 }] },
    ],
  });
}

export const MOCK_MODE = !hasAI;
