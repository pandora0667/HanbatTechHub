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

    await this.menuCacheRepository.setWeeklyMenu(mondayDate, menus);

    for (const menu of menus) {
      await this.menuCacheRepository.setMenuByDate(menu.date, menu);
    }
  }
}
