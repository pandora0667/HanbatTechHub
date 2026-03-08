import { NoticeDetail, NoticeSummary } from '../../domain/models/notice.model';

export type NoticeGroupType = 'featured' | 'new' | 'today';

export const NOTICE_CACHE_REPOSITORY = 'NOTICE_CACHE_REPOSITORY';

export interface NoticeCacheRepository {
  getRegularNotices(): Promise<NoticeSummary[]>;
  saveRegularNotices(notices: NoticeSummary[]): Promise<void>;
  getNoticeGroup(group: NoticeGroupType): Promise<NoticeSummary[] | null>;
  saveNoticeGroup(
    group: NoticeGroupType,
    notices: NoticeSummary[],
  ): Promise<void>;
  getNoticeDetail(nttId: string): Promise<NoticeDetail | null>;
  saveNoticeDetail(nttId: string, detail: NoticeDetail): Promise<void>;
}
