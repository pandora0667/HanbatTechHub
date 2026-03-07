import { Inject, Injectable } from '@nestjs/common';
import {
  NOTICE_CACHE_REPOSITORY,
  NoticeCacheRepository,
  NoticeGroupType,
} from '../ports/notice-cache.repository';
import { NoticeCollectorService } from '../services/notice-collector.service';
import { NoticeListResponseDto } from '../../dto/notice.dto';
import { NoticePaginationService } from '../../domain/services/notice-pagination.service';

@Injectable()
export class GetNoticeGroupUseCase {
  constructor(
    @Inject(NOTICE_CACHE_REPOSITORY)
    private readonly noticeCacheRepository: NoticeCacheRepository,
    private readonly noticeCollectorService: NoticeCollectorService,
    private readonly noticePaginationService: NoticePaginationService,
  ) {}

  async execute(group: NoticeGroupType): Promise<NoticeListResponseDto> {
    let notices = await this.noticeCacheRepository.getNoticeGroup(group);

    if (!notices) {
      notices = (await this.noticeCollectorService.collect())[group];
    }

    return {
      items: notices,
      meta: this.noticePaginationService.createMeta(
        notices.length,
        1,
        notices.length,
      ),
    };
  }
}
