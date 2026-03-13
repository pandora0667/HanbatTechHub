import { Inject, Injectable } from '@nestjs/common';
import {
  NOTICE_CACHE_REPOSITORY,
  NoticeCacheRepository,
  NoticeGroupType,
} from '../ports/notice-cache.repository';
import { NoticeCollectorService } from '../services/notice-collector.service';
import { PaginatedNotices } from '../../domain/types/paginated-notices.type';
import { NoticePaginationService } from '../../domain/services/notice-pagination.service';
import {
  NOTICE_CACHE_TTL,
  NOTICE_SOURCE_CONFIDENCE,
  NOTICE_SOURCE_ID,
} from '../../constants/notice.constant';
import { buildSnapshotMetadata } from '../../../../common/utils/snapshot.util';

@Injectable()
export class GetNoticeGroupUseCase {
  constructor(
    @Inject(NOTICE_CACHE_REPOSITORY)
    private readonly noticeCacheRepository: NoticeCacheRepository,
    private readonly noticeCollectorService: NoticeCollectorService,
    private readonly noticePaginationService: NoticePaginationService,
  ) {}

  async execute(group: NoticeGroupType): Promise<PaginatedNotices> {
    let notices = await this.noticeCacheRepository.getNoticeGroup(group);
    let lastUpdate = await this.noticeCacheRepository.getLastUpdate();

    if (!notices) {
      notices = (await this.noticeCollectorService.collect())[group];
      lastUpdate = await this.noticeCacheRepository.getLastUpdate();
    }

    return {
      items: notices,
      meta: {
        ...this.noticePaginationService.createMeta(
          notices.length,
          1,
          notices.length === 0 ? 1 : notices.length,
        ),
        snapshot: lastUpdate
          ? buildSnapshotMetadata({
              collectedAt: lastUpdate,
              ttlSeconds: NOTICE_CACHE_TTL,
              confidence: NOTICE_SOURCE_CONFIDENCE,
              sourceIds: [NOTICE_SOURCE_ID],
            })
          : undefined,
      },
    };
  }
}
