/**
 * 첨부 파일 인터페이스
 */
export interface IAttachment {
  /**
   * 파일 이름
   */
  name: string;

  /**
   * 파일 다운로드 링크
   */
  link: string;
}

/**
 * 공지사항 상세 정보 인터페이스
 */
export interface INoticeDetail {
  title: string;

  /**
   * 내용 (순수 텍스트)
   */
  content: string;

  author: string;
  date: string;
  viewCount: number;
  attachments: IAttachment[];
}
