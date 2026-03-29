'use client';

import { useState, useMemo } from 'react';
import { useCaloriesStats, useMacrosStats, useWeightStats, useStatsSummary } from '@/hooks/useApi';
import { today, addDays } from '@/lib/utils';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';

const PERIODS = [
  { label: '7 дней', days: 7 },
  { label: '30 дней', days: 30 },
  { label: '90 дней', days: 90 },
];

export default function StatsPage() {
  const [period, setPeriod] = useState(7);
  const from = useMemo(() => addDays(today(), -period), [period]);
  const to = today();

  const { data: caloriesData } = useCaloriesStats(from, to);
  const { data: macrosData } = useMacrosStats(from, to);
  const { data: weightData } = useWeightStats(from, to);
  const { data: summary } = useStatsSummary();

  const weightChartData = (weightData || []).map((w) => ({
    date: new Date(w.loggedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    weight: w.weightKg,
  }));

  const calChartData = (caloriesData || []).map((d) => ({
    date: d.date.slice(5),
    plan: d.plan,
    actual: d.actual,
  }));

  const macroChartData = (macrosData || []).map((d) => ({
    date: d.date.slice(5),
    protein: Math.round(d.proteinG),
    fat: Math.round(d.fatG),
    carbs: Math.round(d.carbsG),
  }));

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">Статистика</h1>

      {/* Period selector */}
      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.days}
            onClick={() => setPeriod(p.days)}
            className={`flex-1 rounded-lg border py-2 text-xs font-medium transition ${
              period === p.days
                ? 'border-primary bg-primary-50 text-primary-700'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-400">Средн. ккал/день (7д)</div>
            <div className="text-xl font-bold mt-1">{summary.avgCalories7d}</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-400">Дней подряд</div>
            <div className="text-xl font-bold mt-1">{summary.streakDays}</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-400">Выполнение нормы</div>
            <div className="text-xl font-bold mt-1">{summary.completionRate}%</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-400">Прогноз цели</div>
            <div className="text-sm font-bold mt-1">
              {summary.projectedGoalDate || '—'}
            </div>
          </div>
        </div>
      )}

      {/* Weight chart */}
      {weightChartData.length > 0 && (
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold mb-3">Динамика веса</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Вес (кг)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Calories chart */}
      {calChartData.length > 0 && (
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold mb-3">Калории: план vs факт</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={calChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="plan" fill="#e5e7eb" name="План" radius={[2, 2, 0, 0]} />
              <Bar dataKey="actual" fill="#22c55e" name="Факт" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Macros chart */}
      {macroChartData.length > 0 && (
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold mb-3">БЖУ по дням</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={macroChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="protein" stackId="a" fill="#3b82f6" name="Белки" />
              <Bar dataKey="fat" stackId="a" fill="#f59e0b" name="Жиры" />
              <Bar dataKey="carbs" stackId="a" fill="#22c55e" name="Углеводы" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
