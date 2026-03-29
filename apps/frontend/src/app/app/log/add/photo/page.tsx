'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAnalyzePhoto, useAddFoodLog } from '@/hooks/useApi';
import { today } from '@/lib/utils';
import { MEAL_TYPES, MEAL_TYPE_LABELS, type MealType } from '@calsnap/shared';
import type { FoodAnalysisResult } from '@calsnap/shared';

export default function PhotoAddPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const analyzeMutation = useAnalyzePhoto();
  const addMutation = useAddFoodLog();

  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<FoodAnalysisResult[] | null>(null);
  const [mealType, setMealType] = useState<MealType>('lunch');
  // portionG per item — initialized from AI response
  const [portionOverrides, setPortionOverrides] = useState<Record<number, number>>({});

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setResults(null);
    setPortionOverrides({});

    const data = await analyzeMutation.mutateAsync(file);
    setResults(data.items);
  };

  const getPortionG = (item: FoodAnalysisResult, idx: number) => {
    return portionOverrides[idx] ?? item.portionG;
  };

  const getScale = (item: FoodAnalysisResult, idx: number) => {
    if (item.portionG <= 0) return 1;
    return getPortionG(item, idx) / item.portionG;
  };

  const handleAdd = async (item: FoodAnalysisResult, idx: number) => {
    const scale = getScale(item, idx);
    await addMutation.mutateAsync({
      date: today(),
      mealType,
      foodName: item.dishName,
      calories: Math.round(item.calories * scale),
      proteinG: Math.round(item.proteinG * scale),
      fatG: Math.round(item.fatG * scale),
      carbsG: Math.round(item.carbsG * scale),
      portionG: getPortionG(item, idx),
      source: 'photo',
    });
    router.push('/app/today');
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/app/today" className="text-lg">&larr;</Link>
        <h1 className="text-xl font-bold">Фото-анализ</h1>
      </div>

      {/* Upload area */}
      {!preview && (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-gray-300 py-16 text-center hover:border-primary hover:bg-primary-50/30 transition"
        >
          <div className="text-5xl mb-3">📸</div>
          <div className="text-sm font-medium text-gray-500">
            Нажмите, чтобы сфотографировать или выбрать из галереи
          </div>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      {/* Preview */}
      {preview && (
        <div className="mb-4">
          <img
            src={preview}
            alt="Фото еды"
            className="w-full rounded-2xl object-cover max-h-64"
          />
          <button
            onClick={() => {
              setPreview(null);
              setResults(null);
              setPortionOverrides({});
            }}
            className="mt-2 text-sm text-gray-400 hover:text-gray-600"
          >
            Выбрать другое фото
          </button>
        </div>
      )}

      {/* Loading */}
      {analyzeMutation.isPending && (
        <div className="flex items-center justify-center gap-3 py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-gray-500">ИИ анализирует фото...</span>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Meal type */}
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

          {results.map((item, i) => {
            const portionG = getPortionG(item, i);
            const scale = getScale(item, i);

            return (
              <div
                key={i}
                className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{item.dishName}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Уверенность: {Math.round(item.confidence * 100)}%
                    </p>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {Math.round(item.calories * scale)} ккал
                  </span>
                </div>

                {/* Portion slider in grams */}
                {item.portionG > 0 && (
                  <div className="mb-4">
                    <label className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Порция</span>
                      <span className="font-semibold">{portionG} г</span>
                    </label>
                    <input
                      type="range"
                      min={Math.round(item.portionG * 0.25)}
                      max={Math.round(item.portionG * 3)}
                      step={10}
                      value={portionG}
                      onChange={(e) =>
                        setPortionOverrides((prev) => ({ ...prev, [i]: +e.target.value }))
                      }
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                      <span>{Math.round(item.portionG * 0.25)}г</span>
                      <span>{Math.round(item.portionG * 3)}г</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div className="rounded-lg bg-blue-50 py-2">
                    <div className="text-xs text-blue-600">Белки</div>
                    <div className="font-semibold text-sm">{Math.round(item.proteinG * scale)}г</div>
                  </div>
                  <div className="rounded-lg bg-amber-50 py-2">
                    <div className="text-xs text-amber-600">Жиры</div>
                    <div className="font-semibold text-sm">{Math.round(item.fatG * scale)}г</div>
                  </div>
                  <div className="rounded-lg bg-green-50 py-2">
                    <div className="text-xs text-green-600">Углеводы</div>
                    <div className="font-semibold text-sm">{Math.round(item.carbsG * scale)}г</div>
                  </div>
                </div>

                {item.notes && (
                  <p className="text-xs text-gray-400 mb-3">{item.notes}</p>
                )}

                <button
                  onClick={() => handleAdd(item, i)}
                  disabled={addMutation.isPending}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition disabled:opacity-50"
                >
                  {addMutation.isPending ? 'Добавление...' : 'Добавить в дневник'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
