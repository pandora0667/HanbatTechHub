import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetTodayWorkspaceQueryDto {
  @ApiPropertyOptional({
    description: '최신 콘텐츠 섹션에 포함할 최대 게시글 수',
    default: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  contentLimit?: number = 5;

  @ApiPropertyOptional({
    description: '최신 공지 섹션에 포함할 최대 공지 수',
    default: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  noticeLimit?: number = 5;

  @ApiPropertyOptional({
    description: '변화 신호 섹션에 포함할 최대 채용 변화 수',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  changeLimit?: number = 10;

  @ApiPropertyOptional({
    description: '마감 임박 섹션에 포함할 최대 채용 수',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  deadlineLimit?: number = 10;

  @ApiPropertyOptional({
    description: '마감 임박 섹션에서 볼 일수 범위',
    default: 7,
    minimum: 1,
    maximum: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  deadlineWindowDays?: number = 7;

  @ApiPropertyOptional({
    description: 'institution opportunities 섹션 최대 개수',
    default: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  institutionLimit?: number = 5;

  @ApiPropertyOptional({
    description: 'institution 필터(csv). 기본값은 wave-1 학교들',
    example: 'HANBAT,SNU,INU',
  })
  @IsOptional()
  @IsString()
  institutions?: string;
}
