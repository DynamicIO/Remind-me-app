export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  completed: boolean;
  createdAt: string;
  deletedAt?: string;
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
