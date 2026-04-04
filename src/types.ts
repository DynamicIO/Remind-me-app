export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  completed: boolean;
  createdAt: string;
  dueDate?: string;
  notificationId?: string;
  deletedAt?: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);
  const time = formatTime(date);
  if (diffDays === 0) return `Today at ${time}`;
  if (diffDays === 1) return `Tomorrow at ${time}`;
  if (diffDays === -1) return `Yesterday at ${time}`;
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays < 7) return `in ${diffDays}d at ${time}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${time}`;
}

export function isDueOverdue(dateString: string): boolean {
  return new Date(dateString) < new Date();
}

export const CATEGORIES = ['Work', 'Personal', 'Shopping', 'Health', 'Other'] as const;
export type Category = typeof CATEGORIES[number];

export const CATEGORY_COLORS: Record<string, string> = {
  Work: '#60A5FA',
  Personal: '#C084FC',
  Shopping: '#34D399',
  Health: '#FB7185',
  Other: '#FBBF24',
};
