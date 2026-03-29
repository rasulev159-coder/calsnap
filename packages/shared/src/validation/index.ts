import { z } from 'zod';
import { ACTIVITY_LEVELS, DIETARY_PREFERENCES, GENDERS, GOALS, MEAL_TYPES, FOOD_SOURCES } from '../constants';

// ── Auth ──────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  name: z.string().min(1, 'Введите имя'),
});

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

// ── Onboarding / Profile ──────────────────────────────
export const onboardingSchema = z.object({
  gender: z.enum(GENDERS),
  age: z.number().int().min(10).max(120),
  heightCm: z.number().min(100).max(250),
  currentWeightKg: z.number().min(30).max(300),
  targetWeightKg: z.number().min(30).max(300),
  activityLevel: z.enum(Object.keys(ACTIVITY_LEVELS) as [string, ...string[]]),
  goal: z.enum(Object.keys(GOALS) as [string, ...string[]]),
  dietaryPreferences: z.array(z.enum(DIETARY_PREFERENCES)).default([]),
  allergies: z.string().default(''),
});

export const profileUpdateSchema = onboardingSchema.partial();

// ── Food Log ──────────────────────────────────────────
export const foodLogCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(MEAL_TYPES),
  foodName: z.string().min(1),
  calories: z.number().min(0),
  proteinG: z.number().min(0),
  fatG: z.number().min(0),
  carbsG: z.number().min(0),
  portionG: z.number().min(0),
  source: z.enum(FOOD_SOURCES),
});

export const foodLogUpdateSchema = foodLogCreateSchema.partial();

// ── Weight Log ────────────────────────────────────────
export const weightLogSchema = z.object({
  weightKg: z.number().min(30).max(300),
});

// ── Menu ──────────────────────────────────────────────
export const menuRegenerateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(MEAL_TYPES).optional(),
});

// ── AI Chat ───────────────────────────────────────────
export const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
});

// ── Type exports ──────────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type FoodLogCreateInput = z.infer<typeof foodLogCreateSchema>;
export type FoodLogUpdateInput = z.infer<typeof foodLogUpdateSchema>;
export type WeightLogInput = z.infer<typeof weightLogSchema>;
export type MenuRegenerateInput = z.infer<typeof menuRegenerateSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
