'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAddFoodLog, useFoodSearch } from '@/hooks/useApi';
import { today } from '@/lib/utils';
import { MEAL_TYPES, MEAL_TYPE_LABELS, type MealType } from '@calsnap/shared';

interface BasePer100 {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export default function ManualAddPage() {
  const router = useRouter();
  const addMutation = useAddFoodLog();
  const searchMutation = useFoodSearch();

  const [search, setSearch] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [foodName, setFoodName] = useState('');
  const [portionG, setPortionG] = useState(100);
  // Base values per 100g — used to recalculate when portion changes
  const [base, setBase] = useState<BasePer100>({ calories: 0, proteinG: 0, fatG: 0, carbsG: 0 });
  // Manual mode: user entered custom KBJU (not from search)
  const [manualMode, setManualMode] = useState(true);
  const [manualValues, setManualValues] = useState({ calories: 0, proteinG: 0, fatG: 0, carbsG: 0 });

  const scaled = manualMode
    ? manualValues
    : {
        calories: Math.round(base.calories * portionG / 100),
        proteinG: Math.round(base.proteinG * portionG / 100),
        fatG: Math.round(base.fatG * portionG / 100),
        carbsG: Math.round(base.carbsG * portionG / 100),
      };

  const handleSearch = async () => {
    if (!search.trim()) return;
    searchMutation.mutate(search);
  };

  const selectFood = (food: any) => {
    setFoodName(food.name);
    setPortionG(food.portionG || 100);
    setBase({
      calories: food.calories,
      proteinG: food.proteinG,
      fatG: food.fatG,
      carbsG: food.carbsG,
    });
    setManualMode(false);
    setSearch('');
  };

  const handlePortionChange = (newPortion: number) => {
    setPortionG(newPortion);
    if (manualMode) {
      // In manual mode, also scale proportionally from current values
      const ratio = portionG > 0 ? newPortion / portionG : 1;
      setManualValues({
        calories: Math.round(manualValues.calories * ratio),
        proteinG: Math.round(manualValues.proteinG * ratio),
        fatG: Math.round(manualValues.fatG * ratio),
        carbsG: Math.round(manualValues.carbsG * ratio),
      });
    }
  };

  const handleSubmit = async () => {
    if (!foodName) return;
    await addMutation.mutateAsync({
      date: today(),
      mealType,
      source: 'manual',
      foodName,
      portionG,
      ...scaled,
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
                    {food.calories} ккал/100г · Б:{food.proteinG} Ж:{food.fatG} У:{food.carbsG}
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
            value={foodName}
            onChange={(e) => { setFoodName(e.target.value); setManualMode(true); }}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Например: Куриная грудка с рисом"
          />
        </div>

        {/* Portion with auto-recalc indicator */}
        <div>
          <label className="mb-1 flex justify-between text-sm font-medium">
            <span>Порция (г)</span>
            {!manualMode && <span className="text-xs text-primary font-normal">КБЖУ пересчитываются автоматически</span>}
          </label>
          <input
            type="number"
            value={portionG}
            onChange={(e) => handlePortionChange(+e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Калории</label>
            <input
              type="number"
              value={scaled.calories}
              onChange={(e) => { setManualMode(true); setManualValues({ ...manualValues, calories: +e.target.value }); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Белки (г)</label>
            <input
              type="number"
              value={scaled.proteinG}
              onChange={(e) => { setManualMode(true); setManualValues({ ...manualValues, proteinG: +e.target.value }); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Жиры (г)</label>
            <input
              type="number"
              value={scaled.fatG}
              onChange={(e) => { setManualMode(true); setManualValues({ ...manualValues, fatG: +e.target.value }); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Углеводы (г)</label>
            <input
              type="number"
              value={scaled.carbsG}
              onChange={(e) => { setManualMode(true); setManualValues({ ...manualValues, carbsG: +e.target.value }); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!foodName || addMutation.isPending}
        className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow hover:bg-primary-dark transition disabled:opacity-50"
      >
        {addMutation.isPending ? 'Добавление...' : 'Добавить в дневник'}
      </button>
    </div>
  );
}
