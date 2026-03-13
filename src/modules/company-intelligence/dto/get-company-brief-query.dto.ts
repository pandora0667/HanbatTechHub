import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetCompanyBriefQueryDto {
  @ApiPropertyOptional({
    description: '브리프에 포함할 최대 채용 공고 수',
    default: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  jobLimit?: number = 5;

  @ApiPropertyOptional({
    description: '브리프에 포함할 최대 기술 콘텐츠 수',
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
    description: '브리프에 포함할 최대 변화 신호 수',
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
    description: '브리프에 포함할 최대 마감 임박 공고 수',
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
}
