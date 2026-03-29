export const ACTIVITY_LEVELS = {
  sedentary: { label: 'Сидячий', factor: 1.2 },
  moderate: { label: 'Умеренный', factor: 1.375 },
  active: { label: 'Активный', factor: 1.55 },
  very_active: { label: 'Очень активный', factor: 1.725 },
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_LEVELS;

export const GOALS = {
  lose: { label: 'Похудение', calorieAdjustment: -400 },
  maintain: { label: 'Поддержание', calorieAdjustment: 0 },
  gain: { label: 'Набор массы', calorieAdjustment: 400 },
} as const;

export type Goal = keyof typeof GOALS;

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

export const FOOD_SOURCES = ['photo', 'menu', 'manual'] as const;
export type FoodSource = (typeof FOOD_SOURCES)[number];

export const DIETARY_PREFERENCES = [
  'vegetarian',
  'vegan',
  'gluten_free',
  'lactose_free',
] as const;
export type DietaryPreference = (typeof DIETARY_PREFERENCES)[number];

export const DIETARY_PREFERENCE_LABELS: Record<DietaryPreference, string> = {
  vegetarian: 'Вегетарианство',
  vegan: 'Веганство',
  gluten_free: 'Без глютена',
  lactose_free: 'Без лактозы',
};

export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];
