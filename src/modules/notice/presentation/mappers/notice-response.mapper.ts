import { Injectable } from '@nestjs/common';
import {
  NoticeDetailResponseDto,
  NoticeListResponseDto,
} from '../../dto/notice.dto';
import { NoticeDetail, NoticeSummary } from '../../domain/models/notice.model';
import { PaginatedNotices } from '../../domain/types/paginated-notices.type';
import { NoticeDetailResult } from '../../domain/types/notice-detail-result.type';

@Injectable()
export class NoticeResponseMapper {
  toListResponse(result: PaginatedNotices): NoticeListResponseDto {
    return {
      items: result.items.map((notice) => this.toListItem(notice)),
      meta: result.meta,
    };
  }

  toDetailResponse(result: NoticeDetailResult): NoticeDetailResponseDto {
    const detail = result.detail;

    return {
      no: detail.no,
      title: detail.title,
      author: detail.author,
      viewCount: detail.viewCount,
      date: detail.date,
      content: detail.content,
      attachments: detail.attachments.map((attachment) => ({
        name: attachment.name,
        link: attachment.link,
      })),
      snapshot: result.snapshot,
    };
  }

  private toListItem(notice: NoticeSummary): NoticeListResponseDto['items'][number] {
    return {
      no: notice.no,
      title: notice.title,
      author: notice.author,
      viewCount: notice.viewCount,
      date: notice.date,
      link: notice.link,
      hasAttachment: notice.hasAttachment,
      isNew: notice.isNew,
      nttId: notice.nttId,
    };
  }
}
