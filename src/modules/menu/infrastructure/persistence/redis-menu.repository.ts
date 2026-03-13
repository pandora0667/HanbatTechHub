import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import { appendRedisKey } from '../../../../common/utils/redis-key.util';
import { MENU_CACHE_TTL, REDIS_KEYS } from '../../constants/menu.constant';
import { MenuCacheRepository } from '../../application/ports/menu-cache.repository';
import { DailyMenu } from '../../domain/models/menu.model';

@Injectable()
export class RedisMenuRepository implements MenuCacheRepository {
  constructor(private readonly redisService: RedisService) {}

  async getMenuByDate(date: string): Promise<DailyMenu | null> {
    return this.redisService.get<DailyMenu>(
      appendRedisKey(REDIS_KEYS.MENU_DATE, date),
    );
  }

  async setMenuByDate(date: string, menu: DailyMenu): Promise<void> {
    await this.redisService.set(
      appendRedisKey(REDIS_KEYS.MENU_DATE, date),
      menu,
      MENU_CACHE_TTL,
    );
  }

  async getWeeklyMenu(mondayDate: string): Promise<DailyMenu[] | null> {
    return this.redisService.get<DailyMenu[]>(
      appendRedisKey(REDIS_KEYS.MENU_WEEKLY, mondayDate),
    );
  }

  async setWeeklyMenu(mondayDate: string, menus: DailyMenu[]): Promise<void> {
    await this.redisService.set(
      appendRedisKey(REDIS_KEYS.MENU_WEEKLY, mondayDate),
      menus,
      MENU_CACHE_TTL,
    );
  }

  async getMenuLastUpdate(date: string): Promise<string | null> {
    return this.redisService.get<string>(
      appendRedisKey(REDIS_KEYS.MENU_DATE_LAST_UPDATE, date),
    );
  }

  async setMenuLastUpdate(date: string, timestamp: string): Promise<void> {
    await this.redisService.set(
      appendRedisKey(REDIS_KEYS.MENU_DATE_LAST_UPDATE, date),
      timestamp,
      MENU_CACHE_TTL,
    );
  }

  async getWeeklyMenuLastUpdate(mondayDate: string): Promise<string | null> {
    return this.redisService.get<string>(
      appendRedisKey(REDIS_KEYS.MENU_WEEKLY_LAST_UPDATE, mondayDate),
    );
  }

  async setWeeklyMenuLastUpdate(
    mondayDate: string,
    timestamp: string,
  ): Promise<void> {
    await this.redisService.set(
      appendRedisKey(REDIS_KEYS.MENU_WEEKLY_LAST_UPDATE, mondayDate),
      timestamp,
      MENU_CACHE_TTL,
    );
  }
}
