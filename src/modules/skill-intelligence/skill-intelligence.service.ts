import { Injectable } from '@nestjs/common';
import { GetSkillMapUseCase } from './application/use-cases/get-skill-map.use-case';
import { GetSkillMapQueryDto } from './dto/get-skill-map-query.dto';
import { SkillMapResponseDto } from './dto/skill-map.response.dto';

@Injectable()
export class SkillIntelligenceService {
  constructor(private readonly getSkillMapUseCase: GetSkillMapUseCase) {}

  async getSkillMap(
    query: GetSkillMapQueryDto,
  ): Promise<SkillMapResponseDto> {
    return this.getSkillMapUseCase.execute(query);
  }
}
