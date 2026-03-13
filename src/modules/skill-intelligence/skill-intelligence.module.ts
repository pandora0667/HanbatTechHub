import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { GetSkillMapUseCase } from './application/use-cases/get-skill-map.use-case';
import { SkillMapBuilderService } from './domain/services/skill-map-builder.service';
import { SkillNameNormalizerService } from './domain/services/skill-name-normalizer.service';
import { SkillIntelligenceController } from './skill-intelligence.controller';
import { SkillIntelligenceService } from './skill-intelligence.service';

@Module({
  imports: [JobsModule],
  controllers: [SkillIntelligenceController],
  providers: [
    SkillIntelligenceService,
    GetSkillMapUseCase,
    SkillMapBuilderService,
    SkillNameNormalizerService,
  ],
})
export class SkillIntelligenceModule {}
