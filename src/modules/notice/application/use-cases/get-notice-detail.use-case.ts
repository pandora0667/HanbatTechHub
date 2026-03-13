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
import { buildSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import {
  NOTICE_DETAIL_CACHE_TTL,
  NOTICE_SOURCE_CONFIDENCE,
  NOTICE_SOURCE_ID,
} from '../../constants/notice.constant';
import { NoticeDetailResult } from '../../domain/types/notice-detail-result.type';

@Injectable()
export class GetNoticeDetailUseCase {
  constructor(
    @Inject(NOTICE_CACHE_REPOSITORY)
    private readonly noticeCacheRepository: NoticeCacheRepository,
    @Inject(NOTICE_SOURCE_GATEWAY)
    private readonly noticeSourceGateway: NoticeSourceGateway,
    private readonly noticeHtmlParserService: NoticeHtmlParserService,
  ) {}

  async execute(nttId: string): Promise<NoticeDetailResult> {
    const cachedDetail =
      await this.noticeCacheRepository.getNoticeDetail(nttId);
    let lastUpdate = await this.noticeCacheRepository.getDetailLastUpdate(nttId);

    if (cachedDetail) {
      return {
        detail: cachedDetail,
        snapshot: lastUpdate
          ? buildSnapshotMetadata({
              collectedAt: lastUpdate,
              ttlSeconds: NOTICE_DETAIL_CACHE_TTL,
              confidence: NOTICE_SOURCE_CONFIDENCE,
              sourceIds: [NOTICE_SOURCE_ID],
            })
          : undefined,
      };
    }

    const html = await this.noticeSourceGateway.fetchNoticeDetailHtml(nttId);
    const detail = this.noticeHtmlParserService.parseDetail(nttId, html);
    await this.noticeCacheRepository.saveNoticeDetail(nttId, detail);
    lastUpdate = new Date().toISOString();
    await this.noticeCacheRepository.setDetailLastUpdate(nttId, lastUpdate);

    return {
      detail,
      snapshot: buildSnapshotMetadata({
        collectedAt: lastUpdate,
        ttlSeconds: NOTICE_DETAIL_CACHE_TTL,
        confidence: NOTICE_SOURCE_CONFIDENCE,
        sourceIds: [NOTICE_SOURCE_ID],
      }),
    };
  }
}
