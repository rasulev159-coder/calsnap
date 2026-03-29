import Anthropic from '@anthropic-ai/sdk';

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export const MOCK_MODE = !client;

export async function analyzePhotoWithClaude(
  imageBase64: string,
  mimeType: string,
): Promise<string> {
  if (!client) {
    return JSON.stringify({
      items: [
        {
          dish_name: 'Демо-режим: блюдо не распознано',
          confidence: 0,
          portion_g: 0,
          calories: 0,
          protein_g: 0,
          fat_g: 0,
          carbs_g: 0,
          notes: 'Подключите ANTHROPIC_API_KEY для реального распознавания фото',
        },
      ],
    });
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: 'Ты диетолог и эксперт по питанию. Анализируй изображения еды и возвращай ТОЛЬКО JSON без markdown. Если на фото не еда — верни JSON с dish_name: "Это не еда" и нулевыми значениями КБЖУ.',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: imageBase64,
          },
        },
        {
          type: 'text',
          text: 'Определи что на фото. Если это еда — рассчитай КБЖУ. Если на фото несколько блюд — верни массив. Если это НЕ еда — укажи что это не еда. Верни ТОЛЬКО JSON: { "items": [{ "dish_name": "...", "confidence": 0.0-1.0, "portion_g": N, "calories": N, "protein_g": N, "fat_g": N, "carbs_g": N, "notes": "..." }] }',
        },
      ],
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

  // Clean potential markdown wrapping
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return cleaned;
}

export async function generateMenuWithClaude(
  calories: number,
  protein: number,
  fat: number,
  carbs: number,
  goal: string,
  preferences: string[],
  allergies: string,
): Promise<string> {
  if (!client) {
    return JSON.stringify({
      meals: [
        { meal_type: 'breakfast', food_name: 'Овсянка с бананом и орехами', calories: Math.round(calories * 0.25), protein_g: Math.round(protein * 0.2), fat_g: Math.round(fat * 0.2), carbs_g: Math.round(carbs * 0.3), recipe: 'Залить 60г овсянки кипятком, добавить банан и орехи.' },
        { meal_type: 'lunch', food_name: 'Куриная грудка с гречкой', calories: Math.round(calories * 0.35), protein_g: Math.round(protein * 0.4), fat_g: Math.round(fat * 0.25), carbs_g: Math.round(carbs * 0.3), recipe: 'Запечь 150г грудки, отварить 80г гречки, подать с салатом.' },
        { meal_type: 'dinner', food_name: 'Рыба с рисом и овощами', calories: Math.round(calories * 0.3), protein_g: Math.round(protein * 0.3), fat_g: Math.round(fat * 0.35), carbs_g: Math.round(carbs * 0.3), recipe: 'Запечь 150г рыбы, отварить 70г риса, овощи на пару.' },
        { meal_type: 'snack', food_name: 'Йогурт с ягодами', calories: Math.round(calories * 0.1), protein_g: Math.round(protein * 0.1), fat_g: Math.round(fat * 0.2), carbs_g: Math.round(carbs * 0.1), recipe: 'Греческий йогурт 200г с горстью свежих ягод.' },
      ],
    });
  }

  const prefsStr = preferences.length ? `Предпочтения: ${preferences.join(', ')}.` : '';
  const allergyStr = allergies ? `Аллергии: ${allergies}.` : '';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: 'Ты персональный диетолог. Составь план питания на день. Возвращай ТОЛЬКО JSON без markdown.',
    messages: [{
      role: 'user',
      content: `Параметры: ${calories} ккал, Б:${protein}г Ж:${fat}г У:${carbs}г. Цель: ${goal}. ${prefsStr} ${allergyStr}\n\nСоставь меню: завтрак, обед, ужин, 1 перекус. Формат JSON: { "meals": [{ "meal_type": "breakfast|lunch|dinner|snack", "food_name": "...", "calories": N, "protein_g": N, "fat_g": N, "carbs_g": N, "recipe": "2-3 шага" }] }`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

export async function chatWithClaude(
  message: string,
  userContext: string,
): Promise<string> {
  if (!client) {
    return 'Я ваш ИИ-помощник по питанию. Сейчас я работаю в демо-режиме. Подключите ANTHROPIC_API_KEY для полноценной работы.';
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `Ты персональный диетолог-помощник. Контекст пользователя: ${userContext}. Отвечай кратко и по делу на русском.`,
    messages: [{ role: 'user', content: message }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export async function generateWeeklyReportWithClaude(
  userContext: string,
): Promise<string> {
  if (!client) {
    return JSON.stringify({
      summary: 'Демо-режим. Подключите API ключ для персонализированных отчётов.',
      positives: ['Вы пользуетесь CalSnap!'],
      improvements: ['Подключите ANTHROPIC_API_KEY'],
      tip: 'Для полноценной работы ИИ-функций добавьте ключ Anthropic.',
    });
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: 'Ты диетолог. Составь еженедельный отчёт. Верни ТОЛЬКО JSON.',
    messages: [{
      role: 'user',
      content: `${userContext}\n\nСоставь еженедельный отчёт в формате JSON: { "summary": "...", "positives": ["..."], "improvements": ["..."], "tip": "..." }`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

export async function generateWorkoutPlanWithClaude(
  goal: string,
  activityLevel: string,
): Promise<string> {
  if (!client) {
    return JSON.stringify({
      plan: [
        { day: 'Понедельник', exercises: [{ name: 'Приседания', sets: 3, reps: 15, kcal_burn: 80 }, { name: 'Отжимания', sets: 3, reps: 12, kcal_burn: 60 }, { name: 'Планка', sets: 3, reps: 45, kcal_burn: 40 }] },
        { day: 'Среда', exercises: [{ name: 'Выпады', sets: 3, reps: 12, kcal_burn: 70 }, { name: 'Берпи', sets: 3, reps: 10, kcal_burn: 90 }, { name: 'Скручивания', sets: 3, reps: 20, kcal_burn: 50 }] },
        { day: 'Пятница', exercises: [{ name: 'Становая тяга', sets: 3, reps: 10, kcal_burn: 100 }, { name: 'Подтягивания', sets: 3, reps: 8, kcal_burn: 70 }, { name: 'Велосипед (пресс)', sets: 3, reps: 20, kcal_burn: 50 }] },
      ],
    });
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: 'Ты фитнес-тренер. Составь план тренировок. Верни ТОЛЬКО JSON.',
    messages: [{
      role: 'user',
      content: `Цель: ${goal}. Активность: ${activityLevel}.\n\nСоставь план на 3 дня. JSON: { "plan": [{ "day": "...", "exercises": [{ "name": "...", "sets": N, "reps": N, "kcal_burn": N }] }] }`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}
