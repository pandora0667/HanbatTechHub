export type MealType = 'lunch' | 'dinner';

export interface MealMenuItem {
  date: string;
  meal: MealType;
  menu: string[];
}

export interface DailyMenu {
  date: string;
  lunch: string[];
  dinner: string[];
}
