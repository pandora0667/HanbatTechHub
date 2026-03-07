import { Inject, Injectable } from '@nestjs/common';
import {
  MENU_CACHE_REPOSITORY,
  MenuCacheRepository,
} from '../ports/menu-cache.repository';
import { MenuLoaderService } from '../services/menu-loader.service';
import { MenuCalendarService } from '../../domain/services/menu-calendar.service';
import { MenuResponseDto } from '../../dto/menu.dto';

@Injectable()
export class GetWeeklyMenuUseCase {
  constructor(
    @Inject(MENU_CACHE_REPOSITORY)
    private readonly menuCacheRepository: MenuCacheRepository,
    private readonly menuLoaderService: MenuLoaderService,
    private readonly menuCalendarService: MenuCalendarService,
  ) {}

  async execute(startDate?: string): Promise<MenuResponseDto[]> {
    const startDay = startDate ? new Date(startDate) : new Date();
    const mondayDate = this.menuCalendarService.getMondayDate(startDay);
    const formattedMondayDate = this.menuCalendarService.formatDate(mondayDate);
    const cachedWeeklyMenu =
      await this.menuCacheRepository.getWeeklyMenu(formattedMondayDate);

    if (cachedWeeklyMenu) {
      return cachedWeeklyMenu;
    }

    const { mondayDate: cacheKey, menus } =
      await this.menuLoaderService.loadWeeklyMenu(startDate);
    await this.menuCacheRepository.setWeeklyMenu(cacheKey, menus);

    return menus;
  }
}
