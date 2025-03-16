import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const QUADRANT_COLORS = {
  1: 'bg-red-50 border-red-200',
  2: 'bg-blue-50 border-blue-200',
  3: 'bg-yellow-50 border-yellow-200',
  4: 'bg-gray-50 border-gray-200',
} as const;

export const QUADRANT_NAMES = {
  1: 'Do First',
  2: 'Schedule',
  3: 'Delegate',
  4: "Don't Do",
} as const;

export const QUADRANT_TEXT_COLORS = {
  1: 'text-red-700',
  2: 'text-blue-700',
  3: 'text-yellow-700',
  4: 'text-gray-700',
} as const;

export const TASK_SECTIONS = {
  overdue: 'Overdue',
  today: 'Today',
  tomorrow: 'Tomorrow',
  upcoming: 'Upcoming',
  later: 'Later',
  unscheduled: 'Unscheduled',
} as const;

export function getTaskSection(dueDate: string | null) {
  if (!dueDate) return 'unscheduled';

  const now = new Date();
  const due = new Date(dueDate);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (due < now) return 'overdue';
  if (due.toDateString() === now.toDateString()) return 'today';
  if (due.toDateString() === tomorrow.toDateString()) return 'tomorrow';
  if (due <= new Date(now.setDate(now.getDate() + 7))) return 'upcoming';
  return 'later';
}