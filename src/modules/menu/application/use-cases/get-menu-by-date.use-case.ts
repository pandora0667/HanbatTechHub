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
import { MenuQueryResult } from '../../domain/types/menu-query-result.type';

@Injectable()
export class GetMenuByDateUseCase {
  constructor(
    @Inject(MENU_CACHE_REPOSITORY)
    private readonly menuCacheRepository: MenuCacheRepository,
    private readonly menuLoaderService: MenuLoaderService,
    private readonly menuCalendarService: MenuCalendarService,
  ) {}

  async execute(date?: string): Promise<MenuQueryResult> {
    const targetDate = date ? new Date(date) : new Date();
    const formattedDate = this.menuCalendarService.formatDate(targetDate);
    const cachedMenu =
      await this.menuCacheRepository.getMenuByDate(formattedDate);
    let lastUpdate =
      await this.menuCacheRepository.getMenuLastUpdate(formattedDate);

    if (cachedMenu) {
      return {
        menu: cachedMenu,
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

    const { menu } = await this.menuLoaderService.loadMenuByDate(date);
    await this.menuCacheRepository.setMenuByDate(formattedDate, menu);
    lastUpdate = new Date().toISOString();
    await this.menuCacheRepository.setMenuLastUpdate(formattedDate, lastUpdate);

    return {
      menu,
      snapshot: buildSnapshotMetadata({
        collectedAt: lastUpdate,
        ttlSeconds: MENU_CACHE_TTL,
        confidence: MENU_SOURCE_CONFIDENCE,
        sourceIds: [MENU_SOURCE_ID],
      }),
    };
  }
}
