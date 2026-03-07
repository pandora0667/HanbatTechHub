import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import { MENU_CACHE_TTL, REDIS_KEYS } from '../../constants/menu.constant';
import { MenuResponseDto } from '../../dto/menu.dto';
import { MenuCacheRepository } from '../../application/ports/menu-cache.repository';

@Injectable()
export class RedisMenuRepository implements MenuCacheRepository {
  constructor(private readonly redisService: RedisService) {}

  async getMenuByDate(date: string): Promise<MenuResponseDto | null> {
    return this.redisService.get<MenuResponseDto>(
      `${REDIS_KEYS.MENU_DATE}${date}`,
    );
  }

  async setMenuByDate(date: string, menu: MenuResponseDto): Promise<void> {
    await this.redisService.set(
      `${REDIS_KEYS.MENU_DATE}${date}`,
      menu,
      MENU_CACHE_TTL,
    );
  }

  async getWeeklyMenu(mondayDate: string): Promise<MenuResponseDto[] | null> {
    return this.redisService.get<MenuResponseDto[]>(
      `${REDIS_KEYS.MENU_WEEKLY}${mondayDate}`,
    );
  }

  async setWeeklyMenu(
    mondayDate: string,
    menus: MenuResponseDto[],
  ): Promise<void> {
    await this.redisService.set(
      `${REDIS_KEYS.MENU_WEEKLY}${mondayDate}`,
      menus,
      MENU_CACHE_TTL,
    );
  }
}
