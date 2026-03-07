import { Injectable } from '@nestjs/common';
import { NoticeItemDto } from './dto/notice.dto';
import { RedisService } from '../redis/redis.service';
import { REDIS_KEYS, NOTICE_CACHE_TTL } from './constants/notice.constant';

@Injectable()
export class NoticeRepository {
  constructor(private readonly redisService: RedisService) {}

  async getNotices(): Promise<NoticeItemDto[]> {
    const cachedNotices = await this.redisService.get<NoticeItemDto[]>(
      REDIS_KEYS.NOTICE_LIST,
    );
    return cachedNotices || [];
  }

  async saveNotices(notices: NoticeItemDto[]): Promise<void> {
    await this.redisService.set(
      REDIS_KEYS.NOTICE_LIST,
      notices,
      NOTICE_CACHE_TTL,
    );
  }
}
