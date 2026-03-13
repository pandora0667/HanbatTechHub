import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetSkillMapQueryDto } from './dto/get-skill-map-query.dto';
import { SkillMapResponseDto } from './dto/skill-map.response.dto';
import { SkillIntelligenceService } from './skill-intelligence.service';

@ApiTags('skills')
@Controller('skills')
export class SkillIntelligenceController {
  constructor(
    private readonly skillIntelligenceService: SkillIntelligenceService,
  ) {}

  @Get('map')
  @ApiOperation({
    summary: '현재 채용 스냅샷 기반 기술 수요 맵 조회',
  })
  @ApiResponse({
    status: 200,
    description: '회사 분포와 샘플 직무를 포함한 기술 수요 맵',
    type: SkillMapResponseDto,
  })
  async getSkillMap(
    @Query() query: GetSkillMapQueryDto,
  ): Promise<SkillMapResponseDto> {
    return this.skillIntelligenceService.getSkillMap(query);
  }
}
