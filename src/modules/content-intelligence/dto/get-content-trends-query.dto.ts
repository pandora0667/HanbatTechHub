import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetContentTrendsQueryDto {
  @ApiPropertyOptional({
    description: '트렌드 윈도우 일수',
    default: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;

  @ApiPropertyOptional({
    description: '최소 언급 횟수',
    default: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  minMentions?: number = 2;

  @ApiPropertyOptional({
    description: '반환할 최대 topic 수',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
