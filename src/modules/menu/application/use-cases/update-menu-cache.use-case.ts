import { Inject, Injectable } from '@nestjs/common';
import {
  MENU_CACHE_REPOSITORY,
  MenuCacheRepository,
} from '../ports/menu-cache.repository';
import { MenuLoaderService } from '../services/menu-loader.service';

@Injectable()
export class UpdateMenuCacheUseCase {
  constructor(
    @Inject(MENU_CACHE_REPOSITORY)
    private readonly menuCacheRepository: MenuCacheRepository,
    private readonly menuLoaderService: MenuLoaderService,
  ) {}

  async execute(referenceDate?: string): Promise<void> {
    const { mondayDate, menus } =
      await this.menuLoaderService.loadWeeklyMenu(referenceDate);
    const collectedAt = new Date().toISOString();

    await this.menuCacheRepository.setWeeklyMenu(mondayDate, menus);
    await this.menuCacheRepository.setWeeklyMenuLastUpdate(
      mondayDate,
      collectedAt,
    );

    for (const menu of menus) {
      await this.menuCacheRepository.setMenuByDate(menu.date, menu);
      await this.menuCacheRepository.setMenuLastUpdate(menu.date, collectedAt);
    }
  }
}
