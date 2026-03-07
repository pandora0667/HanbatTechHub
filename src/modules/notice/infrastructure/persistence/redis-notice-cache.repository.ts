import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import {
  NOTICE_CACHE_TTL,
  NOTICE_DETAIL_CACHE_TTL,
  REDIS_KEYS,
} from '../../constants/notice.constant';
import {
  NoticeDetailResponseDto,
  NoticeItemDto,
} from '../../dto/notice.dto';
import {
  NoticeCacheRepository,
  NoticeGroupType,
} from '../../application/ports/notice-cache.repository';

@Injectable()
export class RedisNoticeCacheRepository implements NoticeCacheRepository {
  constructor(private readonly redisService: RedisService) {}

  async getRegularNotices(): Promise<NoticeItemDto[]> {
    return (
      (await this.redisService.get<NoticeItemDto[]>(REDIS_KEYS.NOTICE_LIST)) || []
    );
  }

  async saveRegularNotices(notices: NoticeItemDto[]): Promise<void> {
    await this.redisService.set(
      REDIS_KEYS.NOTICE_LIST,
      notices,
      NOTICE_CACHE_TTL,
    );
  }

  async getNoticeGroup(group: NoticeGroupType): Promise<NoticeItemDto[] | null> {
    return this.redisService.get<NoticeItemDto[]>(this.getGroupKey(group));
  }

  async saveNoticeGroup(
    group: NoticeGroupType,
    notices: NoticeItemDto[],
  ): Promise<void> {
    await this.redisService.set(
      this.getGroupKey(group),
      notices,
      NOTICE_CACHE_TTL,
    );
  }

  async getNoticeDetail(
    nttId: string,
  ): Promise<NoticeDetailResponseDto | null> {
    return this.redisService.get<NoticeDetailResponseDto>(
      `${REDIS_KEYS.NOTICE_DETAIL}${nttId}`,
    );
  }

  async saveNoticeDetail(
    nttId: string,
    detail: NoticeDetailResponseDto,
  ): Promise<void> {
    await this.redisService.set(
      `${REDIS_KEYS.NOTICE_DETAIL}${nttId}`,
      detail,
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
