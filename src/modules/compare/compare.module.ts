import { Module } from '@nestjs/common';
import { CompanyIntelligenceModule } from '../company-intelligence/company-intelligence.module';
import { SkillIntelligenceModule } from '../skill-intelligence/skill-intelligence.module';
import { GetCompanyCompareUseCase } from './application/use-cases/get-company-compare.use-case';
import { CompareController } from './compare.controller';
import { CompareService } from './compare.service';
import { CompanyCompareOverviewService } from './domain/services/company-compare-overview.service';

@Module({
  imports: [CompanyIntelligenceModule, SkillIntelligenceModule],
  controllers: [CompareController],
  providers: [
    CompareService,
    GetCompanyCompareUseCase,
    CompanyCompareOverviewService,
  ],
})
export class CompareModule {}
