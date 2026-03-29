'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  DaySummary,
  FoodLog,
  FoodAnalysisResponse,
  MenuPlan,
  DailyNorms,
  WeightLog,
  CaloriesStat,
  MacrosStat,
  StatsSummary,
  WorkoutPlan,
} from '@calsnap/shared';

// ── Daily Summary ─────────────────────────────────────
export function useDaySummary(date: string) {
  return useQuery<DaySummary>({
    queryKey: ['day-summary', date],
    queryFn: async () => {
      const res = await api.get(`/logs/summary?date=${date}`);
      return res.data.data;
    },
  });
}

// ── Food Logs ─────────────────────────────────────────
export function useFoodLogs(date: string) {
  return useQuery<FoodLog[]>({
    queryKey: ['food-logs', date],
    queryFn: async () => {
      const res = await api.get(`/logs?date=${date}`);
      return res.data.data;
    },
  });
}

export function useAddFoodLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/logs', data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food-logs'] });
      qc.invalidateQueries({ queryKey: ['day-summary'] });
    },
  });
}

export function useDeleteFoodLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/logs/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food-logs'] });
      qc.invalidateQueries({ queryKey: ['day-summary'] });
    },
  });
}

// ── Photo Analysis ────────────────────────────────────
export function useAnalyzePhoto() {
  return useMutation<FoodAnalysisResponse, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await api.post('/food/analyze-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    },
  });
}

// ── Food Search ───────────────────────────────────────
export function useFoodSearch() {
  return useMutation({
    mutationFn: async (query: string) => {
      const res = await api.post('/food/search', { query });
      return res.data.data;
    },
  });
}

// ── Daily Norms ───────────────────────────────────────
export function useDailyNorms() {
  return useQuery<DailyNorms>({
    queryKey: ['daily-norms'],
    queryFn: async () => {
      const res = await api.get('/profile/norms');
      return res.data.data;
    },
  });
}

// ── Weight ────────────────────────────────────────────
export function useWeightHistory() {
  return useQuery<WeightLog[]>({
    queryKey: ['weight-history'],
    queryFn: async () => {
      const res = await api.get('/profile/weight');
      return res.data.data;
    },
  });
}

export function useAddWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (weightKg: number) => {
      const res = await api.post('/profile/weight', { weightKg });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weight-history'] });
    },
  });
}

// ── Menu ──────────────────────────────────────────────
export function useMenu(date: string) {
  return useQuery<MenuPlan>({
    queryKey: ['menu', date],
    queryFn: async () => {
      const res = await api.get(`/menu?date=${date}`);
      return res.data.data;
    },
  });
}

export function useRegenerateMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (date: string) => {
      const res = await api.post('/menu/regenerate', { date });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useEatMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ menuId, mealId }: { menuId: string; mealId: string }) => {
      const res = await api.put(`/menu/${menuId}/eat`, { mealId });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu'] });
      qc.invalidateQueries({ queryKey: ['day-summary'] });
      qc.invalidateQueries({ queryKey: ['food-logs'] });
    },
  });
}

export function useSkipMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ menuId, mealId }: { menuId: string; mealId: string }) => {
      const res = await api.put(`/menu/${menuId}/skip`, { mealId });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

// ── Stats ─────────────────────────────────────────────
export function useCaloriesStats(from: string, to: string) {
  return useQuery<CaloriesStat[]>({
    queryKey: ['stats-calories', from, to],
    queryFn: async () => {
      const res = await api.get(`/stats/calories?from=${from}&to=${to}`);
      return res.data.data;
    },
  });
}

export function useMacrosStats(from: string, to: string) {
  return useQuery<MacrosStat[]>({
    queryKey: ['stats-macros', from, to],
    queryFn: async () => {
      const res = await api.get(`/stats/macros?from=${from}&to=${to}`);
      return res.data.data;
    },
  });
}

export function useWeightStats(from: string, to: string) {
  return useQuery<WeightLog[]>({
    queryKey: ['stats-weight', from, to],
    queryFn: async () => {
      const res = await api.get(`/stats/weight?from=${from}&to=${to}`);
      return res.data.data;
    },
  });
}

export function useStatsSummary() {
  return useQuery<StatsSummary>({
    queryKey: ['stats-summary'],
    queryFn: async () => {
      const res = await api.get('/stats/summary');
      return res.data.data;
    },
  });
}

// ── Workout ───────────────────────────────────────────
export function useWorkoutPlan() {
  return useQuery<WorkoutPlan>({
    queryKey: ['workout-plan'],
    queryFn: async () => {
      const res = await api.get('/workout/plan');
      return res.data.data;
    },
  });
}

export function useCompleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (day: string) => {
      const res = await api.put(`/workout/${encodeURIComponent(day)}/done`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workout-plan'] });
    },
  });
}

// ── AI ────────────────────────────────────────────────
export function useAiChat() {
  return useMutation({
    mutationFn: async (message: string) => {
      const res = await api.post('/ai/chat', { message });
      return res.data.data;
    },
  });
}

export function useWeeklyReport() {
  return useQuery({
    queryKey: ['weekly-report'],
    queryFn: async () => {
      const res = await api.get('/ai/weekly-report');
      return res.data.data;
    },
  });
}
