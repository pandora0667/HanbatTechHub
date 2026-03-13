import { Module } from '@nestjs/common';
import { CompanyIntelligenceModule } from '../company-intelligence/company-intelligence.module';
import { SkillIntelligenceModule } from '../skill-intelligence/skill-intelligence.module';
import { GetCompanyResearchUseCase } from './application/use-cases/get-company-research.use-case';
import { CompanyResearchBuilderService } from './domain/services/company-research-builder.service';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';

@Module({
  imports: [CompanyIntelligenceModule, SkillIntelligenceModule],
  controllers: [ResearchController],
  providers: [
    ResearchService,
    GetCompanyResearchUseCase,
    CompanyResearchBuilderService,
  ],
})
export class ResearchModule {}
