import { Inject, Injectable } from '@nestjs/common';
import {
  NOTICE_CACHE_REPOSITORY,
  NoticeCacheRepository,
} from '../ports/notice-cache.repository';
import {
  NOTICE_SOURCE_GATEWAY,
  NoticeSourceGateway,
} from '../ports/notice-source.gateway';
import { NoticeHtmlParserService } from '../../infrastructure/services/notice-html-parser.service';
import { NoticeGroupingService } from '../../domain/services/notice-grouping.service';
import { NoticeGroups } from '../../domain/models/notice.model';

@Injectable()
export class NoticeCollectorService {
  constructor(
    @Inject(NOTICE_CACHE_REPOSITORY)
    private readonly noticeCacheRepository: NoticeCacheRepository,
    @Inject(NOTICE_SOURCE_GATEWAY)
    private readonly noticeSourceGateway: NoticeSourceGateway,
    private readonly noticeHtmlParserService: NoticeHtmlParserService,
    private readonly noticeGroupingService: NoticeGroupingService,
  ) {}

  async collect(): Promise<NoticeGroups> {
    const collectedAt = new Date().toISOString();
    const html = await this.noticeSourceGateway.fetchNoticeListHtml();
    const notices = this.noticeHtmlParserService.parseList(html);
    const grouped = this.noticeGroupingService.classify(notices);

    await Promise.all([
      this.noticeCacheRepository.saveRegularNotices(grouped.regular),
      this.noticeCacheRepository.saveNoticeGroup('featured', grouped.featured),
      this.noticeCacheRepository.saveNoticeGroup('new', grouped.new),
      this.noticeCacheRepository.saveNoticeGroup('today', grouped.today),
      this.noticeCacheRepository.setLastUpdate(collectedAt),
    ]);

    return grouped;
  }
}
