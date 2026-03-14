import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetMarketOverviewQueryDto {
  @ApiPropertyOptional({
    description: '상위 회사 리더보드 개수',
    default: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  topCompanyLimit?: number = 5;

  @ApiPropertyOptional({
    description: '상위 기술 리더보드 개수',
    default: 10,
    minimum: 1,
    maximum: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  topSkillLimit?: number = 10;

  @ApiPropertyOptional({
    description: '상위 필드 리더보드 개수',
    default: 8,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  topFieldLimit?: number = 8;

  @ApiPropertyOptional({
    description: '노출할 stale source 개수',
    default: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  staleSourceLimit?: number = 5;

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
    description: '시장 추세 계산에 사용할 최근 히스토리 포인트 수',
    default: 10,
    minimum: 1,
    maximum: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  historyPoints?: number = 10;

  @ApiPropertyOptional({
    description: '회사/필드/기술 momentum 섹션 상위 개수',
    default: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  trendLimit?: number = 5;
}
