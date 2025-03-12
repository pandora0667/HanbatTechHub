import { IsString, IsOptional, IsDate, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BlogPostDto {
  @ApiProperty({ description: '포스트 고유 ID' })
  @IsString()
  readonly id: string;

  @ApiProperty({ description: '회사명' })
  @IsString()
  readonly company: string;

  @ApiProperty({ description: '포스트 제목' })
  @IsString()
  readonly title: string;

  @ApiProperty({ description: '포스트 설명' })
  @IsString()
  readonly description: string;

  @ApiProperty({ description: '포스트 링크' })
  @IsUrl()
  readonly link: string;

  @ApiPropertyOptional({ description: '작성자' })
  @IsOptional()
  @IsString()
  readonly author?: string;

  @ApiProperty({ description: '발행일' })
  @Type(() => Date)
  @IsDate()
  readonly publishDate: Date;
}
