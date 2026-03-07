import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ description: '전체 아이템 수' })
  readonly totalCount: number;

  @ApiProperty({ description: '현재 페이지' })
  readonly currentPage: number;

  @ApiProperty({ description: '전체 페이지 수' })
  readonly totalPages: number;

  @ApiProperty({ description: '다음 페이지 존재 여부' })
  readonly hasNextPage: boolean;

  @ApiProperty({ description: '이전 페이지 존재 여부' })
  readonly hasPreviousPage: boolean;
}

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
  @ApiProperty({ description: '공지사항 번호' })
  readonly no: string;

  @ApiProperty({ description: '공지사항 제목' })
  readonly title: string;

  @ApiProperty({ description: '작성자' })
  readonly author: string;

  @ApiProperty({ description: '조회수' })
  readonly viewCount: number;

  @ApiProperty({ description: '작성일' })
  readonly date: string;

  @ApiProperty({ description: '공지사항 링크' })
  readonly link: string;

  @ApiProperty({ description: '첨부파일 여부' })
  readonly hasAttachment: boolean;

  @ApiProperty({ description: '새 글 여부' })
  readonly isNew: boolean;

  @ApiProperty({ description: '게시글 ID' })
  readonly nttId: string;
}

/**
 * 공지사항 목록 응답 DTO
 */
export class NoticeListResponseDto {
  @ApiProperty({ type: [NoticeItemDto] })
  readonly items: NoticeItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  readonly meta: PaginationMetaDto;
}

export class AttachmentDto {
  @ApiProperty({ description: '첨부파일 이름' })
  readonly name: string;

  @ApiProperty({ description: '첨부파일 링크' })
  readonly link: string;
}

/**
 * 공지사항 상세 정보 응답 DTO
 */
export class NoticeDetailResponseDto {
  @ApiProperty({ description: '공지사항 번호' })
  readonly no: string;

  @ApiProperty({ description: '공지사항 제목' })
  readonly title: string;

  @ApiProperty({ description: '작성자' })
  readonly author: string;

  @ApiProperty({ description: '조회수' })
  readonly viewCount: number;

  @ApiProperty({ description: '작성일' })
  readonly date: string;

  @ApiProperty({ description: '공지사항 내용' })
  readonly content: string;

  @ApiProperty({ description: '첨부파일 목록', type: [AttachmentDto] })
  readonly attachments: AttachmentDto[];
}
