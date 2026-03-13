import { Inject, Injectable } from '@nestjs/common';
import {
  MENU_CACHE_REPOSITORY,
  MenuCacheRepository,
} from '../ports/menu-cache.repository';
import { MenuLoaderService } from '../services/menu-loader.service';
import { MenuCalendarService } from '../../domain/services/menu-calendar.service';
import { buildSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import {
  MENU_CACHE_TTL,
  MENU_SOURCE_CONFIDENCE,
  MENU_SOURCE_ID,
} from '../../constants/menu.constant';
import { WeeklyMenuQueryResult } from '../../domain/types/menu-query-result.type';

@Injectable()
export class GetWeeklyMenuUseCase {
  constructor(
    @Inject(MENU_CACHE_REPOSITORY)
    private readonly menuCacheRepository: MenuCacheRepository,
    private readonly menuLoaderService: MenuLoaderService,
    private readonly menuCalendarService: MenuCalendarService,
  ) {}

  async execute(startDate?: string): Promise<WeeklyMenuQueryResult> {
    const startDay = startDate ? new Date(startDate) : new Date();
    const mondayDate = this.menuCalendarService.getMondayDate(startDay);
    const formattedMondayDate = this.menuCalendarService.formatDate(mondayDate);
    const cachedWeeklyMenu =
      await this.menuCacheRepository.getWeeklyMenu(formattedMondayDate);
    let lastUpdate =
      await this.menuCacheRepository.getWeeklyMenuLastUpdate(formattedMondayDate);

    if (cachedWeeklyMenu) {
      return {
        menus: cachedWeeklyMenu,
        snapshot: lastUpdate
          ? buildSnapshotMetadata({
              collectedAt: lastUpdate,
              ttlSeconds: MENU_CACHE_TTL,
              confidence: MENU_SOURCE_CONFIDENCE,
              sourceIds: [MENU_SOURCE_ID],
            })
          : undefined,
      };
    }

    const { mondayDate: cacheKey, menus } =
      await this.menuLoaderService.loadWeeklyMenu(startDate);
    await this.menuCacheRepository.setWeeklyMenu(cacheKey, menus);
    lastUpdate = new Date().toISOString();
    await this.menuCacheRepository.setWeeklyMenuLastUpdate(cacheKey, lastUpdate);

    return {
      menus,
      snapshot: buildSnapshotMetadata({
        collectedAt: lastUpdate,
        ttlSeconds: MENU_CACHE_TTL,
        confidence: MENU_SOURCE_CONFIDENCE,
        sourceIds: [MENU_SOURCE_ID],
      }),
    };
  }
}
