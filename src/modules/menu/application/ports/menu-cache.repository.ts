import { DailyMenu } from '../../domain/models/menu.model';

export const MENU_CACHE_REPOSITORY = 'MENU_CACHE_REPOSITORY';

export interface MenuCacheRepository {
  getMenuByDate(date: string): Promise<DailyMenu | null>;
  setMenuByDate(date: string, menu: DailyMenu): Promise<void>;
  getWeeklyMenu(mondayDate: string): Promise<DailyMenu[] | null>;
  setWeeklyMenu(mondayDate: string, menus: DailyMenu[]): Promise<void>;
}
