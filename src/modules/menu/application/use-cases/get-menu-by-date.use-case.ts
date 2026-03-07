import { Inject, Injectable } from '@nestjs/common';
import {
  MENU_CACHE_REPOSITORY,
  MenuCacheRepository,
} from '../ports/menu-cache.repository';
import { MenuLoaderService } from '../services/menu-loader.service';
import { MenuCalendarService } from '../../domain/services/menu-calendar.service';
import { MenuResponseDto } from '../../dto/menu.dto';

@Injectable()
export class GetMenuByDateUseCase {
  constructor(
    @Inject(MENU_CACHE_REPOSITORY)
    private readonly menuCacheRepository: MenuCacheRepository,
    private readonly menuLoaderService: MenuLoaderService,
    private readonly menuCalendarService: MenuCalendarService,
  ) {}

  async execute(date?: string): Promise<MenuResponseDto> {
    const targetDate = date ? new Date(date) : new Date();
    const formattedDate = this.menuCalendarService.formatDate(targetDate);
    const cachedMenu =
      await this.menuCacheRepository.getMenuByDate(formattedDate);

    if (cachedMenu) {
      return cachedMenu;
    }

    const { menu } = await this.menuLoaderService.loadMenuByDate(date);
    await this.menuCacheRepository.setMenuByDate(formattedDate, menu);

    return menu;
  }
}
