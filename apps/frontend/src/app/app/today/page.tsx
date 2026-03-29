'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDaySummary, useDeleteFoodLog } from '@/hooks/useApi';
import { today, addDays, formatDateRu } from '@/lib/utils';
import { MEAL_TYPE_LABELS, type MealType } from '@calsnap/shared';

function CalorieRing({ plan, actual }: { plan: number; actual: number }) {
  const pct = plan > 0 ? Math.min((actual / plan) * 100, 100) : 0;
  const r = 60;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct > 100 ? '#ef4444' : pct > 80 ? '#f97316' : '#22c55e';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="160" height="160" className="-rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold">{Math.round(actual)}</div>
        <div className="text-xs text-gray-500">из {plan} ккал</div>
      </div>
    </div>
  );
}

function MacroBar({ label, actual, plan, color }: { label: string; actual: number; plan: number; color: string }) {
  const pct = plan > 0 ? Math.min((actual / plan) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">
          {Math.round(actual)}г / {plan}г
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function TodayPage() {
  const [date, setDate] = useState(today());
  const { data: summary, isLoading } = useDaySummary(date);
  const deleteMutation = useDeleteFoodLog();

  const goDay = (dir: number) => setDate(addDays(date, dir));

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const plan = summary?.plan || { calories: 2000, proteinG: 150, fatG: 67, carbsG: 225 };
  const actual = summary?.actual || { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 };
  const logs = summary?.logs || [];

  const grouped = (['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => ({
    type,
    label: MEAL_TYPE_LABELS[type],
    items: logs.filter((l) => l.mealType === type),
  }));

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      {/* Date navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => goDay(-1)} className="rounded-lg p-2 hover:bg-gray-100 text-lg">
          &larr;
        </button>
        <h2 className="text-lg font-semibold">
          {date === today() ? 'Сегодня' : formatDateRu(date)}
        </h2>
        <button
          onClick={() => goDay(1)}
          disabled={date === today()}
          className="rounded-lg p-2 hover:bg-gray-100 text-lg disabled:opacity-30"
        >
          &rarr;
        </button>
      </div>

      {/* Calorie ring */}
      <div className="flex justify-center mb-6">
        <CalorieRing plan={plan.calories} actual={actual.calories} />
      </div>

      {/* Macros */}
      <div className="space-y-3 mb-8 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
        <MacroBar label="Белки" actual={actual.proteinG} plan={plan.proteinG} color="#3b82f6" />
        <MacroBar label="Жиры" actual={actual.fatG} plan={plan.fatG} color="#f59e0b" />
        <MacroBar label="Углеводы" actual={actual.carbsG} plan={plan.carbsG} color="#22c55e" />
      </div>

      {/* Meals list */}
      {grouped.map((group) => (
        <div key={group.type} className="mb-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {group.label}
          </h3>
          {group.items.length === 0 ? (
            <div className="rounded-xl bg-white p-4 text-center text-sm text-gray-400 border border-dashed border-gray-200">
              Пусто
            </div>
          ) : (
            <div className="space-y-2">
              {group.items.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100"
                >
                  <div>
                    <div className="font-medium text-sm">{log.foodName}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Б:{Math.round(log.proteinG)} Ж:{Math.round(log.fatG)} У:{Math.round(log.carbsG)}
                      {log.portionG > 0 && ` · ${log.portionG}г`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-primary">{log.calories} ккал</span>
                    <button
                      onClick={() => deleteMutation.mutate(log.id)}
                      className="text-gray-300 hover:text-red-400 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Add button */}
      <div className="flex gap-3 mt-6 mb-4">
        <Link
          href="/app/log/add/photo"
          className="flex-1 rounded-xl bg-primary py-3 text-center text-sm font-semibold text-white shadow hover:bg-primary-dark transition"
        >
          📸 Фото
        </Link>
        <Link
          href="/app/log/add/manual"
          className="flex-1 rounded-xl border border-gray-300 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          ✏️ Вручную
        </Link>
      </div>
    </div>
  );
}
