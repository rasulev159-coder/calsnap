'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAddFoodLog, useFoodSearch } from '@/hooks/useApi';
import { today } from '@/lib/utils';
import { MEAL_TYPES, MEAL_TYPE_LABELS, type MealType } from '@calsnap/shared';

export default function ManualAddPage() {
  const router = useRouter();
  const addMutation = useAddFoodLog();
  const searchMutation = useFoodSearch();

  const [search, setSearch] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [form, setForm] = useState({
    foodName: '',
    calories: 0,
    proteinG: 0,
    fatG: 0,
    carbsG: 0,
    portionG: 100,
  });

  const update = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSearch = async () => {
    if (!search.trim()) return;
    searchMutation.mutate(search);
  };

  const selectFood = (food: any) => {
    setForm({
      foodName: food.name,
      calories: food.calories,
      proteinG: food.proteinG,
      fatG: food.fatG,
      carbsG: food.carbsG,
      portionG: food.portionG || 100,
    });
    setSearch('');
  };

  const handleSubmit = async () => {
    if (!form.foodName) return;
    await addMutation.mutateAsync({
      date: today(),
      mealType,
      source: 'manual',
      ...form,
    });
    router.push('/app/today');
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/app/today" className="text-lg">&larr;</Link>
        <h1 className="text-xl font-bold">Добавить вручную</h1>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Поиск продукта..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleSearch}
            className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium hover:bg-gray-200 transition"
          >
            Найти
          </button>
        </div>

        {searchMutation.data && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white">
            {searchMutation.data.length === 0 ? (
              <div className="p-3 text-sm text-gray-400 text-center">Не найдено</div>
            ) : (
              searchMutation.data.map((food: any, i: number) => (
                <button
                  key={i}
                  onClick={() => selectFood(food)}
                  className="w-full border-b border-gray-100 px-4 py-3 text-left text-sm hover:bg-gray-50 last:border-0"
                >
                  <div className="font-medium">{food.name}</div>
                  <div className="text-xs text-gray-400">
                    {food.calories} ккал · Б:{food.proteinG} Ж:{food.fatG} У:{food.carbsG}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Meal type */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">Приём пищи</label>
        <div className="flex gap-2">
          {MEAL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setMealType(type)}
              className={`flex-1 rounded-lg border py-2 text-xs font-medium transition ${
                mealType === type
                  ? 'border-primary bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              {MEAL_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
        <div>
          <label className="mb-1 block text-sm font-medium">Название блюда</label>
          <input
            type="text"
            value={form.foodName}
            onChange={(e) => update('foodName', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Например: Куриная грудка с рисом"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Калории</label>
            <input
              type="number"
              value={form.calories}
              onChange={(e) => update('calories', +e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Порция (г)</label>
            <input
              type="number"
              value={form.portionG}
              onChange={(e) => update('portionG', +e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Белки (г)</label>
            <input
              type="number"
              value={form.proteinG}
              onChange={(e) => update('proteinG', +e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Жиры (г)</label>
            <input
              type="number"
              value={form.fatG}
              onChange={(e) => update('fatG', +e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Углеводы (г)</label>
            <input
              type="number"
              value={form.carbsG}
              onChange={(e) => update('carbsG', +e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!form.foodName || addMutation.isPending}
        className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow hover:bg-primary-dark transition disabled:opacity-50"
      >
        {addMutation.isPending ? 'Добавление...' : 'Добавить в дневник'}
      </button>
    </div>
  );
}
