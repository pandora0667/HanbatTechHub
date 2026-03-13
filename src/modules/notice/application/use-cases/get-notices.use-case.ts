import { Inject, Injectable } from '@nestjs/common';
import {
  NOTICE_CACHE_REPOSITORY,
  NoticeCacheRepository,
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
export class GetNoticesUseCase {
  constructor(
    @Inject(NOTICE_CACHE_REPOSITORY)
    private readonly noticeCacheRepository: NoticeCacheRepository,
    private readonly noticeCollectorService: NoticeCollectorService,
    private readonly noticePaginationService: NoticePaginationService,
  ) {}

  async execute(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedNotices> {
    let notices = await this.noticeCacheRepository.getRegularNotices();
    let lastUpdate = await this.noticeCacheRepository.getLastUpdate();

    if (notices.length === 0) {
      notices = (await this.noticeCollectorService.collect()).regular;
      lastUpdate = await this.noticeCacheRepository.getLastUpdate();
    }

    const paginated = this.noticePaginationService.paginate(notices, page, limit);

    return {
      ...paginated,
      meta: {
        ...paginated.meta,
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
