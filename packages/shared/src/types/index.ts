import type {
  ActivityLevel,
  DietaryPreference,
  FoodSource,
  Gender,
  Goal,
  MealType,
} from '../constants';

// ── User ──────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  gender: Gender;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  dietaryPreferences: DietaryPreference[];
  allergies: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

// ── Daily Norms ───────────────────────────────────────
export interface DailyNorms {
  id: string;
  userId: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  calculatedAt: string;
}

// ── Food Log ──────────────────────────────────────────
export interface FoodLog {
  id: string;
  userId: string;
  date: string;
  mealType: MealType;
  foodName: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  portionG: number;
  source: FoodSource;
  createdAt: string;
}

export interface DaySummary {
  date: string;
  plan: { calories: number; proteinG: number; fatG: number; carbsG: number };
  actual: { calories: number; proteinG: number; fatG: number; carbsG: number };
  logs: FoodLog[];
}

// ── Food Analysis ─────────────────────────────────────
export interface FoodAnalysisResult {
  dishName: string;
  confidence: number;
  portionG: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  notes: string;
}

export interface FoodAnalysisResponse {
  items: FoodAnalysisResult[];
}

// ── Weight Log ────────────────────────────────────────
export interface WeightLog {
  id: string;
  userId: string;
  weightKg: number;
  loggedAt: string;
}

// ── Menu Plan ─────────────────────────────────────────
export interface MenuMeal {
  id: string;
  mealType: MealType;
  foodName: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  recipe: string;
  isEaten: boolean;
}

export interface MenuPlan {
  id: string;
  userId: string;
  date: string;
  meals: MenuMeal[];
  generatedAt: string;
}

// ── Workout Plan ──────────────────────────────────────
export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  kcalBurn: number;
}

export interface WorkoutDay {
  day: string;
  exercises: Exercise[];
  isDone: boolean;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  weekStart: string;
  plan: WorkoutDay[];
  generatedAt: string;
}

// ── Stats ─────────────────────────────────────────────
export interface CaloriesStat {
  date: string;
  plan: number;
  actual: number;
}

export interface MacrosStat {
  date: string;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export interface StatsSummary {
  avgCalories7d: number;
  avgCalories30d: number;
  streakDays: number;
  completionRate: number;
  projectedGoalDate: string | null;
}

// ── AI Assistant ──────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── API Response ──────────────────────────────────────
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
