import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import { appendRedisKey } from '../../../../common/utils/redis-key.util';
import {
  NOTICE_CACHE_TTL,
  NOTICE_DETAIL_CACHE_TTL,
  REDIS_KEYS,
} from '../../constants/notice.constant';
import {
  NoticeCacheRepository,
  NoticeGroupType,
} from '../../application/ports/notice-cache.repository';
import { NoticeDetail, NoticeSummary } from '../../domain/models/notice.model';

@Injectable()
export class RedisNoticeCacheRepository implements NoticeCacheRepository {
  constructor(private readonly redisService: RedisService) {}

  async getRegularNotices(): Promise<NoticeSummary[]> {
    return (
      (await this.redisService.get<NoticeSummary[]>(REDIS_KEYS.NOTICE_LIST)) ||
      []
    );
  }

  async saveRegularNotices(notices: NoticeSummary[]): Promise<void> {
    await this.redisService.set(
      REDIS_KEYS.NOTICE_LIST,
      notices,
      NOTICE_CACHE_TTL,
    );
  }

  async getNoticeGroup(
    group: NoticeGroupType,
  ): Promise<NoticeSummary[] | null> {
    return this.redisService.get<NoticeSummary[]>(this.getGroupKey(group));
  }

  async saveNoticeGroup(
    group: NoticeGroupType,
    notices: NoticeSummary[],
  ): Promise<void> {
    await this.redisService.set(
      this.getGroupKey(group),
      notices,
      NOTICE_CACHE_TTL,
    );
  }

  async getNoticeDetail(nttId: string): Promise<NoticeDetail | null> {
    return this.redisService.get<NoticeDetail>(
      appendRedisKey(REDIS_KEYS.NOTICE_DETAIL, nttId),
    );
  }

  async saveNoticeDetail(nttId: string, detail: NoticeDetail): Promise<void> {
    await this.redisService.set(
      appendRedisKey(REDIS_KEYS.NOTICE_DETAIL, nttId),
      detail,
      NOTICE_DETAIL_CACHE_TTL,
    );
  }

  async getLastUpdate(): Promise<string | null> {
    return this.redisService.get<string>(REDIS_KEYS.NOTICE_LAST_UPDATE);
  }

  async setLastUpdate(timestamp: string): Promise<void> {
    await this.redisService.set(
      REDIS_KEYS.NOTICE_LAST_UPDATE,
      timestamp,
      NOTICE_CACHE_TTL,
    );
  }

  async getDetailLastUpdate(nttId: string): Promise<string | null> {
    return this.redisService.get<string>(
      appendRedisKey(REDIS_KEYS.NOTICE_DETAIL_LAST_UPDATE, nttId),
    );
  }

  async setDetailLastUpdate(nttId: string, timestamp: string): Promise<void> {
    await this.redisService.set(
      appendRedisKey(REDIS_KEYS.NOTICE_DETAIL_LAST_UPDATE, nttId),
      timestamp,
      NOTICE_DETAIL_CACHE_TTL,
    );
  }

  private getGroupKey(group: NoticeGroupType): string {
    switch (group) {
      case 'featured':
        return REDIS_KEYS.NOTICE_FEATURED;
      case 'new':
        return REDIS_KEYS.NOTICE_NEW;
      case 'today':
        return REDIS_KEYS.NOTICE_TODAY;
    }
  }
}
