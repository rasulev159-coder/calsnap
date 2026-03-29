'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import {
  ACTIVITY_LEVELS,
  GOALS,
  DIETARY_PREFERENCES,
  DIETARY_PREFERENCE_LABELS,
  type Gender,
  type ActivityLevel,
  type Goal,
  type DietaryPreference,
} from '@calsnap/shared';

const STEPS = ['Основное', 'Парам��тры', 'Цель', 'Предпочтения'];

export default function OnboardingPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    gender: 'male' as Gender,
    age: 25,
    heightCm: 175,
    currentWeightKg: 75,
    targetWeightKg: 70,
    activityLevel: 'moderate' as ActivityLevel,
    goal: 'lose' as Goal,
    dietaryPreferences: [] as DietaryPreference[],
    allergies: '',
  });

  const update = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const togglePref = (pref: DietaryPreference) => {
    setForm((prev) => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(pref)
        ? prev.dietaryPreferences.filter((p) => p !== pref)
        : [...prev.dietaryPreferences, pref],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.put('/profile', form);
      setUser(res.data.data);
      router.push('/app/today');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleSubmit();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Расскажите о себе</h1>
          <p className="mt-1 text-sm text-gray-500">
            Шаг {step + 1} из {STEPS.length}: {STEPS[step]}
          </p>
          <div className="mt-3 flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Пол</label>
                <div className="flex gap-3">
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => update('gender', g)}
                      className={`flex-1 rounded-lg border py-3 text-sm font-medium transition ${
                        form.gender === g
                          ? 'border-primary bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {g === 'male' ? 'Мужской' : 'Женский'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Возраст</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => update('age', +e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  min={10}
                  max={120}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Рост (см)</label>
                <input
                  type="number"
                  value={form.heightCm}
                  onChange={(e) => update('heightCm', +e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Текущий вес (кг)</label>
                <input
                  type="number"
                  value={form.currentWeightKg}
                  onChange={(e) => update('currentWeightKg', +e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Целевой вес (кг)</label>
                <input
                  type="number"
                  value={form.targetWeightKg}
                  onChange={(e) => update('targetWeightKg', +e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Уровень активности</label>
                <div className="space-y-2">
                  {(Object.entries(ACTIVITY_LEVELS) as [ActivityLevel, { label: string }][]).map(
                    ([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => update('activityLevel', key)}
                        className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                          form.activityLevel === key
                            ? 'border-primary bg-primary-50 text-primary-700 font-medium'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {val.label}
                      </button>
                    ),
                  )}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Цель</label>
                <div className="space-y-2">
                  {(Object.entries(GOALS) as [Goal, { label: string }][]).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update('goal', key)}
                      className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                        form.goal === key
                          ? 'border-primary bg-primary-50 text-primary-700 font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Пищевые предпочтения</label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_PREFERENCES.map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => togglePref(pref)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        form.dietaryPreferences.includes(pref)
                          ? 'border-primary bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {DIETARY_PREFERENCE_LABELS[pref]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Аллергии</label>
                <textarea
                  value={form.allergies}
                  onChange={(e) => update('allergies', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Например: орехи, лактоза..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Назад
              </button>
            )}
            <button
              type="button"
              onClick={next}
              disabled={loading}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : step < STEPS.length - 1 ? 'Далее' : 'Готово'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
