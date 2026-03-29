import { ACTIVITY_LEVELS, GOALS } from '../constants';
import type { ActivityLevel, Gender, Goal } from '../constants';

/**
 * Mifflin-St Jeor BMR formula
 */
export function calculateBMR(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

/**
 * TDEE = BMR * activity factor
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_LEVELS[activityLevel].factor);
}

/**
 * Target calories = TDEE + goal adjustment
 */
export function calculateTargetCalories(tdee: number, goal: Goal): number {
  return Math.round(tdee + GOALS[goal].calorieAdjustment);
}

/**
 * Calculate macros from target calories
 * Protein: 25-30% → 27.5% avg
 * Fat: 25-30% → 27.5% avg
 * Carbs: 40-50% → 45% avg
 */
export function calculateMacros(targetCalories: number): {
  proteinG: number;
  fatG: number;
  carbsG: number;
} {
  const proteinCal = targetCalories * 0.275;
  const fatCal = targetCalories * 0.275;
  const carbsCal = targetCalories * 0.45;

  return {
    proteinG: Math.round(proteinCal / 4), // 4 cal per gram
    fatG: Math.round(fatCal / 9),          // 9 cal per gram
    carbsG: Math.round(carbsCal / 4),      // 4 cal per gram
  };
}

/**
 * Full norms calculation pipeline
 */
export function calculateDailyNorms(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number,
  activityLevel: ActivityLevel,
  goal: Goal,
): { calories: number; proteinG: number; fatG: number; carbsG: number } {
  const bmr = calculateBMR(gender, weightKg, heightCm, age);
  const tdee = calculateTDEE(bmr, activityLevel);
  const calories = calculateTargetCalories(tdee, goal);
  const macros = calculateMacros(calories);

  return { calories, ...macros };
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function today(): string {
  return formatDate(new Date());
}
