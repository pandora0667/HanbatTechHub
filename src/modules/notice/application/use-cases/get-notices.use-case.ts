import { Inject, Injectable } from '@nestjs/common';
import {
  NOTICE_CACHE_REPOSITORY,
  NoticeCacheRepository,
} from '../ports/notice-cache.repository';
import { NoticeCollectorService } from '../services/notice-collector.service';
import { PaginatedNotices } from '../../domain/types/paginated-notices.type';
import { NoticePaginationService } from '../../domain/services/notice-pagination.service';

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

    if (notices.length === 0) {
      notices = (await this.noticeCollectorService.collect()).regular;
    }

    return this.noticePaginationService.paginate(notices, page, limit);
  }
}
