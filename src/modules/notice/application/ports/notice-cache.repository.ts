import {
  NoticeDetailResponseDto,
  NoticeItemDto,
} from '../../dto/notice.dto';

export type NoticeGroupType = 'featured' | 'new' | 'today';

export const NOTICE_CACHE_REPOSITORY = 'NOTICE_CACHE_REPOSITORY';

export interface NoticeCacheRepository {
  getRegularNotices(): Promise<NoticeItemDto[]>;
  saveRegularNotices(notices: NoticeItemDto[]): Promise<void>;
  getNoticeGroup(group: NoticeGroupType): Promise<NoticeItemDto[] | null>;
  saveNoticeGroup(group: NoticeGroupType, notices: NoticeItemDto[]): Promise<void>;
  getNoticeDetail(nttId: string): Promise<NoticeDetailResponseDto | null>;
  saveNoticeDetail(
    nttId: string,
    detail: NoticeDetailResponseDto,
  ): Promise<void>;
}
