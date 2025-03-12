/**
 * 공지사항 목록 요청 DTO
 */
export class NoticeRequestDto {
  // 검색 기능 비활성화 - 검색 관련 속성 제거
}

/**
 * 공지사항 항목 DTO
 */
export class NoticeItemDto {
  no: string; // 번호
  title: string; // 제목
  author: string; // 작성자
  viewCount: number; // 조회수
  date: string; // 등록일
  link: string; // 상세 페이지 링크
  hasAttachment: boolean; // 첨부파일 여부
  isNew: boolean; // 새 글 여부
  nttId: string; // 게시글 ID
}

/**
 * 공지사항 목록 응답 DTO
 */
export class NoticeResponseDto {
  items: NoticeItemDto[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

/**
 * 공지사항 상세 정보 응답 DTO
 */
export class NoticeDetailResponseDto {
  /**
   * 제목
   */
  title: string;

  /**
   * 내용 (순수 텍스트로 변경)
   */
  content: string;

  /**
   * 작성자
   */
  author: string;

  /**
   * 등록일
   */
  date: string;

  /**
   * 조회수
   */
  viewCount: number;

  /**
   * 첨부파일 목록
   */
  attachments: {
    name: string;
    link: string;
  }[];
}
