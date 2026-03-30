export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date): string {
  // Use local timezone, not UTC
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function today(): string {
  return formatDate(new Date());
}

export function addDays(date: string, days: number): string {
  const d = new Date(date + 'T12:00:00'); // noon to avoid timezone edge cases
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function formatDateRu(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}
