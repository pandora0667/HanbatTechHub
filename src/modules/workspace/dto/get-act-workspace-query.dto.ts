import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetActWorkspaceQueryDto {
  @ApiPropertyOptional({
    description: '최종 액션 리스트 최대 개수',
    default: 12,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 12;

  @ApiPropertyOptional({
    description: '마감 임박 채용에서 가져올 최대 개수',
    default: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  deadlineLimit?: number = 5;

  @ApiPropertyOptional({
    description: '신규 채용 변화에서 가져올 최대 개수',
    default: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  newJobLimit?: number = 5;

  @ApiPropertyOptional({
    description: '수정된 채용 변화에서 가져올 최대 개수',
    default: 3,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  updatedJobLimit?: number = 3;

  @ApiPropertyOptional({
    description: '기관 공지에서 가져올 최대 개수',
    default: 3,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  noticeLimit?: number = 3;

  @ApiPropertyOptional({
    description: '읽을 기술 콘텐츠에서 가져올 최대 개수',
    default: 3,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  contentLimit?: number = 3;

  @ApiPropertyOptional({
    description: '마감 임박 판단 일수',
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
    description: 'institution opportunity에서 가져올 최대 개수',
    default: 3,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  institutionLimit?: number = 3;

  @ApiPropertyOptional({
    description: 'institution 필터(csv). 기본값은 wave-1 학교들',
    example: 'HANBAT,SNU,INU',
  })
  @IsOptional()
  @IsString()
  institutions?: string;
}
