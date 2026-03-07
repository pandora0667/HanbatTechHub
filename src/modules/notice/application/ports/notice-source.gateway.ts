export const NOTICE_SOURCE_GATEWAY = 'NOTICE_SOURCE_GATEWAY';

export interface NoticeSourceGateway {
  fetchNoticeListHtml(): Promise<string>;
  fetchNoticeDetailHtml(nttId: string): Promise<string>;
}
