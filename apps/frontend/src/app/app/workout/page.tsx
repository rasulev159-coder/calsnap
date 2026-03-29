'use client';

import { useWorkoutPlan, useCompleteWorkout } from '@/hooks/useApi';
import type { WorkoutDay, Exercise } from '@calsnap/shared';

export default function WorkoutPage() {
  const { data: plan, isLoading } = useWorkoutPlan();
  const completeMutation = useCompleteWorkout();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const days = (plan?.plan || []) as WorkoutDay[];

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="text-xl font-bold mb-6">План тренировок</h1>

      <div className="space-y-4">
        {days.map((day) => {
          const totalKcal = day.exercises.reduce((s, e) => s + e.kcalBurn, 0);
          return (
            <div
              key={day.day}
              className={`rounded-2xl bg-white p-5 shadow-sm border transition ${
                day.isDone ? 'border-green-200 bg-green-50/50' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{day.day}</h3>
                  <span className="text-xs text-gray-400">~{totalKcal} ккал</span>
                </div>
                {day.isDone ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    ✓ Выполнено
                  </span>
                ) : (
                  <button
                    onClick={() => completeMutation.mutate(day.day)}
                    disabled={completeMutation.isPending}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark transition"
                  >
                    Выполнил
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {day.exercises.map((ex, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span>{ex.name}</span>
                    <span className="text-xs text-gray-400">
                      {ex.sets}x{ex.reps} · {ex.kcalBurn} ккал
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {days.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🏋️</div>
          <p>План тренировок пока не создан</p>
        </div>
      )}
    </div>
  );
}
