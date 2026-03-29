'use client';

import { useState } from 'react';
import { useMenu, useRegenerateMenu, useEatMeal, useSkipMeal } from '@/hooks/useApi';
import { today, formatDateRu } from '@/lib/utils';
import { MEAL_TYPE_LABELS, type MealType } from '@calsnap/shared';

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

export default function MenuPage() {
  const [date] = useState(today());
  const { data: menu, isLoading } = useMenu(date);
  const regenerateMutation = useRegenerateMenu();
  const eatMutation = useEatMeal();
  const skipMutation = useSkipMeal();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const meals = (menu?.meals || []) as any[];
  const totalCal = meals.reduce((s: number, m: any) => s + m.calories, 0);
  const eatenCal = meals.filter((m: any) => m.isEaten).reduce((s: number, m: any) => s + m.calories, 0);
  const pct = totalCal > 0 ? Math.round((eatenCal / totalCal) * 100) : 0;

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Меню на сегодня</h1>
        <button
          onClick={() => regenerateMutation.mutate(date)}
          disabled={regenerateMutation.isPending}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium hover:bg-gray-200 transition disabled:opacity-50"
        >
          {regenerateMutation.isPending ? '...' : '🔄 Обновить'}
        </button>
      </div>

      {/* Progress */}
      <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Прогресс дня</span>
          <span className="font-semibold">{pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-gray-200">
          <div
            className="h-3 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-400">
          <span>Съедено: {eatenCal} ккал</span>
          <span>Всего: {totalCal} ккал</span>
        </div>
      </div>

      {/* Meals */}
      <div className="space-y-4">
        {meals.map((meal: any) => (
          <div
            key={meal.id}
            className={`rounded-2xl bg-white p-5 shadow-sm border transition ${
              meal.isEaten ? 'border-green-200 bg-green-50/50' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{MEAL_ICONS[meal.mealType] || '🍽️'}</span>
                <div>
                  <div className="text-xs text-gray-400 uppercase">
                    {MEAL_TYPE_LABELS[meal.mealType as MealType]}
                  </div>
                  <h3 className="font-semibold">{meal.foodName}</h3>
                </div>
              </div>
              <span className="text-sm font-bold text-primary">{meal.calories} ккал</span>
            </div>

            <div className="flex gap-4 text-xs text-gray-500 mb-3">
              <span>Б: {meal.proteinG}г</span>
              <span>Ж: {meal.fatG}г</span>
              <span>У: {meal.carbsG}г</span>
            </div>

            {meal.recipe && (
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">{meal.recipe}</p>
            )}

            {!meal.isEaten && menu && (
              <div className="flex gap-2">
                <button
                  onClick={() => eatMutation.mutate({ menuId: menu.id, mealId: meal.id })}
                  disabled={eatMutation.isPending}
                  className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-white hover:bg-primary-dark transition"
                >
                  ✓ Съел
                </button>
                <button
                  onClick={() => skipMutation.mutate({ menuId: menu.id, mealId: meal.id })}
                  disabled={skipMutation.isPending}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition"
                >
                  Пропустить
                </button>
              </div>
            )}

            {meal.isEaten && (
              <div className="text-xs text-green-600 font-medium">✓ Съедено</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
