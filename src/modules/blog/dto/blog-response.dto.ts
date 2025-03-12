import { ApiProperty } from '@nestjs/swagger';
import { BlogPostDto } from './blog-post.dto';

export class PaginationMetaDto {
  @ApiProperty({ description: '전체 아이템 수' })
  readonly total: number;

  @ApiProperty({ description: '현재 페이지' })
  readonly page: number;

  @ApiProperty({ description: '페이지당 아이템 수' })
  readonly limit: number;

  @ApiProperty({ description: '다음 페이지 존재 여부' })
  readonly hasNext: boolean;
}

export class BlogResponseDto {
  @ApiProperty({ type: [BlogPostDto] })
  readonly items: BlogPostDto[];

  @ApiProperty({ type: PaginationMetaDto })
  readonly meta: PaginationMetaDto;
}

export class CompanyListResponseDto {
  @ApiProperty({ description: '회사 이름' })
  readonly name: string;

  @ApiProperty({ description: '회사 코드' })
  readonly code: string;
}
