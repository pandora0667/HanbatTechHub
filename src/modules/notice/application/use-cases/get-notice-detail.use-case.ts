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
import { NoticeDetail } from '../../domain/models/notice.model';

@Injectable()
export class GetNoticeDetailUseCase {
  constructor(
    @Inject(NOTICE_CACHE_REPOSITORY)
    private readonly noticeCacheRepository: NoticeCacheRepository,
    @Inject(NOTICE_SOURCE_GATEWAY)
    private readonly noticeSourceGateway: NoticeSourceGateway,
    private readonly noticeHtmlParserService: NoticeHtmlParserService,
  ) {}

  async execute(nttId: string): Promise<NoticeDetail> {
    const cachedDetail =
      await this.noticeCacheRepository.getNoticeDetail(nttId);

    if (cachedDetail) {
      return cachedDetail;
    }

    const html = await this.noticeSourceGateway.fetchNoticeDetailHtml(nttId);
    const detail = this.noticeHtmlParserService.parseDetail(nttId, html);
    await this.noticeCacheRepository.saveNoticeDetail(nttId, detail);

    return detail;
  }
}
