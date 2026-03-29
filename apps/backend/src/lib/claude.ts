/**
 * Claude API wrapper.
 * Currently returns mock data — replace with real Anthropic SDK when API key is available.
 *
 * To enable real Claude:
 * 1. pnpm add @anthropic-ai/sdk (in backend)
 * 2. Set ANTHROPIC_API_KEY in .env
 * 3. Uncomment the real implementation below
 */

// import Anthropic from '@anthropic-ai/sdk';
// const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const MOCK_MODE = !process.env.ANTHROPIC_API_KEY;

export async function analyzePhotoWithClaude(
  _imageBase64: string,
  _mimeType: string,
): Promise<string> {
  if (MOCK_MODE) {
    return JSON.stringify({
      items: [
        {
          dish_name: 'Плов с бараниной',
          confidence: 0.88,
          portion_g: 300,
          calories: 420,
          protein_g: 18,
          fat_g: 16,
          carbs_g: 52,
          notes: 'Оценка по стандартной порции узбекского плова',
        },
      ],
    });
  }

  // Real implementation:
  // const response = await client.messages.create({
  //   model: 'claude-sonnet-4-20250514',
  //   max_tokens: 1024,
  //   messages: [{
  //     role: 'user',
  //     content: [
  //       { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
  //       { type: 'text', text: 'Определи блюдо(а) на фото и рассчитай КБЖУ. Если блюд несколько — верни массив. Верни ТОЛЬКО JSON: { "items": [{ "dish_name": "...", "confidence": 0.0-1.0, "portion_g": N, "calories": N, "protein_g": N, "fat_g": N, "carbs_g": N, "notes": "..." }] }' }
  //     ]
  //   }],
  //   system: 'Ты диетолог и эксперт по питанию. Анализируй изображения еды и возвращай ТОЛЬКО JSON без markdown.',
  // });
  // return response.content[0].type === 'text' ? response.content[0].text : '';
  return '';
}

export async function generateMenuWithClaude(
  _calories: number,
  _protein: number,
  _fat: number,
  _carbs: number,
  _goal: string,
  _preferences: string[],
  _allergies: string,
): Promise<string> {
  if (MOCK_MODE) {
    return JSON.stringify({
      meals: [
        {
          meal_type: 'breakfast',
          food_name: 'Овсянка с бананом и орехами',
          calories: 380,
          protein_g: 12,
          fat_g: 14,
          carbs_g: 52,
          recipe: '1. Залить 60г овсянки кипятком. 2. Добавить нарезанный банан и 15г грецких орехов. 3. Посыпать корицей.',
        },
        {
          meal_type: 'lunch',
          food_name: 'Куриная грудка с гречкой и овощами',
          calories: 520,
          protein_g: 42,
          fat_g: 12,
          carbs_g: 58,
          recipe: '1. Запечь 150г куриной грудки с травами. 2. Отварить 80г гречки. 3. Подать с салатом из свежих овощей.',
        },
        {
          meal_type: 'dinner',
          food_name: 'Лосось с рисом и брокколи',
          calories: 480,
          protein_g: 35,
          fat_g: 18,
          carbs_g: 42,
          recipe: '1. Запечь 150г лосося в фольге с лимоном. 2. Отварить 70г риса. 3. Приготовить брокколи на пару.',
        },
        {
          meal_type: 'snack',
          food_name: 'Греческий йогурт с ягодами',
          calories: 180,
          protein_g: 15,
          fat_g: 6,
          carbs_g: 18,
          recipe: '1. Выложить 200г греческого йогурта. 2. Добавить горсть свежих ягод. 3. Полить чайной ложкой мёда.',
        },
      ],
    });
  }

  return '';
}

export async function chatWithClaude(
  _message: string,
  _userContext: string,
): Promise<string> {
  if (MOCK_MODE) {
    return 'Я ваш ИИ-помощник по питанию. Сейчас я работаю в демо-режиме. Подключите API ключ Anthropic для полноценной работы.';
  }

  return '';
}

export async function generateWeeklyReportWithClaude(
  _userContext: string,
): Promise<string> {
  if (MOCK_MODE) {
    return JSON.stringify({
      summary: 'За эту неделю вы хорошо соблюдали план питания.',
      positives: ['Стабильное потребление белка', 'Регулярные приёмы пищи'],
      improvements: ['Увеличить потребление овощей', 'Пить больше воды'],
      tip: 'Попробуйте добавить больше клетчатки — она помогает дольше чувствовать сытость.',
    });
  }

  return '';
}

export async function generateWorkoutPlanWithClaude(
  _goal: string,
  _activityLevel: string,
): Promise<string> {
  if (MOCK_MODE) {
    return JSON.stringify({
      plan: [
        {
          day: 'Понедельник',
          exercises: [
            { name: 'Приседания', sets: 3, reps: 15, kcal_burn: 80 },
            { name: 'Отжимания', sets: 3, reps: 12, kcal_burn: 60 },
            { name: 'Планка', sets: 3, reps: 45, kcal_burn: 40 },
          ],
        },
        {
          day: 'Среда',
          exercises: [
            { name: 'Выпады', sets: 3, reps: 12, kcal_burn: 70 },
            { name: 'Берпи', sets: 3, reps: 10, kcal_burn: 90 },
            { name: 'Скручивания', sets: 3, reps: 20, kcal_burn: 50 },
          ],
        },
        {
          day: 'Пятница',
          exercises: [
            { name: 'Становая тяга', sets: 3, reps: 10, kcal_burn: 100 },
            { name: 'Подтягивания', sets: 3, reps: 8, kcal_burn: 70 },
            { name: 'Велосипед (пресс)', sets: 3, reps: 20, kcal_burn: 50 },
          ],
        },
      ],
    });
  }

  return '';
}
