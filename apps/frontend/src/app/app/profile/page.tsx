'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useDailyNorms, useWeightHistory, useAddWeight } from '@/hooks/useApi';
import api from '@/lib/api';
import {
  ACTIVITY_LEVELS,
  GOALS,
  DIETARY_PREFERENCE_LABELS,
  type ActivityLevel,
  type Goal,
  type DietaryPreference,
} from '@calsnap/shared';

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const { data: norms } = useDailyNorms();
  const { data: weightHistory } = useWeightHistory();
  const addWeightMutation = useAddWeight();
  const router = useRouter();

  const [newWeight, setNewWeight] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    age: user?.age || 25,
    heightCm: user?.heightCm || 175,
    targetWeightKg: user?.targetWeightKg || 70,
    activityLevel: (user?.activityLevel || 'moderate') as ActivityLevel,
    goal: (user?.goal || 'lose') as Goal,
  });

  const handleAddWeight = async () => {
    const w = parseFloat(newWeight);
    if (isNaN(w) || w < 30 || w > 300) return;
    await addWeightMutation.mutateAsync(w);
    setNewWeight('');
  };

  const handleSaveProfile = async () => {
    try {
      const res = await api.put('/profile', editForm);
      setUser(res.data.data);
      setEditing(false);
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="text-xl font-bold mb-6">Профиль</h1>

      {/* User info */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-2xl">
            {user.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{user.name}</h2>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-400">Пол:</span> {user.gender === 'male' ? 'Муж' : 'Жен'}</div>
          <div><span className="text-gray-400">Возраст:</span> {user.age}</div>
          <div><span className="text-gray-400">Рост:</span> {user.heightCm} см</div>
          <div><span className="text-gray-400">Вес:</span> {user.currentWeightKg} кг</div>
          <div><span className="text-gray-400">Цель:</span> {user.targetWeightKg} кг</div>
          <div><span className="text-gray-400">Активность:</span> {ACTIVITY_LEVELS[user.activityLevel as ActivityLevel]?.label}</div>
          <div><span className="text-gray-400">Цель:</span> {GOALS[user.goal as Goal]?.label}</div>
        </div>

        {user.dietaryPreferences?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {user.dietaryPreferences.map((p) => (
              <span key={p} className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
                {DIETARY_PREFERENCE_LABELS[p as DietaryPreference]}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => setEditing(!editing)}
          className="mt-4 w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          {editing ? 'Отмена' : 'Редактировать'}
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 mb-4 space-y-3">
          <div>
            <label className="text-xs text-gray-400">Возраст</label>
            <input
              type="number"
              value={editForm.age}
              onChange={(e) => setEditForm({ ...editForm, age: +e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Целевой вес (кг)</label>
            <input
              type="number"
              value={editForm.targetWeightKg}
              onChange={(e) => setEditForm({ ...editForm, targetWeightKg: +e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mt-1"
            />
          </div>
          <button
            onClick={handleSaveProfile}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white"
          >
            Сохранить
          </button>
        </div>
      )}

      {/* Daily norms */}
      {norms && (
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-semibold mb-3">Ваша дневная норма</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-lg bg-gray-50 py-2">
              <div className="text-xs text-gray-400">Ккал</div>
              <div className="font-bold">{norms.calories}</div>
            </div>
            <div className="rounded-lg bg-blue-50 py-2">
              <div className="text-xs text-blue-500">Белки</div>
              <div className="font-bold">{norms.proteinG}г</div>
            </div>
            <div className="rounded-lg bg-amber-50 py-2">
              <div className="text-xs text-amber-500">Жиры</div>
              <div className="font-bold">{norms.fatG}г</div>
            </div>
            <div className="rounded-lg bg-green-50 py-2">
              <div className="text-xs text-green-500">Углеводы</div>
              <div className="font-bold">{norms.carbsG}г</div>
            </div>
          </div>
        </div>
      )}

      {/* Weight log */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 mb-4">
        <h3 className="font-semibold mb-3">Записать вес</h3>
        <div className="flex gap-2">
          <input
            type="number"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            placeholder="Вес (кг)"
            step="0.1"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={handleAddWeight}
            disabled={addWeightMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            +
          </button>
        </div>

        {weightHistory && weightHistory.length > 0 && (
          <div className="mt-3 max-h-32 overflow-y-auto">
            {weightHistory.slice(0, 10).map((w) => (
              <div key={w.id} className="flex justify-between border-b border-gray-50 py-1.5 text-sm">
                <span className="text-gray-400">
                  {new Date(w.loggedAt).toLocaleDateString('ru-RU')}
                </span>
                <span className="font-medium">{w.weightKg} кг</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition mb-8"
      >
        Выйти из аккаунта
      </button>
    </div>
  );
}
