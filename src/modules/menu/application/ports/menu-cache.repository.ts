import { MenuResponseDto } from '../../dto/menu.dto';

export const MENU_CACHE_REPOSITORY = 'MENU_CACHE_REPOSITORY';

export interface MenuCacheRepository {
  getMenuByDate(date: string): Promise<MenuResponseDto | null>;
  setMenuByDate(date: string, menu: MenuResponseDto): Promise<void>;
  getWeeklyMenu(mondayDate: string): Promise<MenuResponseDto[] | null>;
  setWeeklyMenu(mondayDate: string, menus: MenuResponseDto[]): Promise<void>;
}
