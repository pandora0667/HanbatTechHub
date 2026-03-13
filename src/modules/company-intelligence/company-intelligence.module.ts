import { Module } from '@nestjs/common';
import { BlogModule } from '../blog/blog.module';
import { JobsModule } from '../jobs/jobs.module';
import { SignalsModule } from '../signals/signals.module';
import { SourceRegistryModule } from '../source-registry/source-registry.module';
import { GetCompanyBriefUseCase } from './application/use-cases/get-company-brief.use-case';
import { CompanyIntelligenceController } from './company-intelligence.controller';
import { CompanyIntelligenceService } from './company-intelligence.service';
import { CompanyBriefOverviewService } from './domain/services/company-brief-overview.service';

@Module({
  imports: [JobsModule, BlogModule, SignalsModule, SourceRegistryModule],
  controllers: [CompanyIntelligenceController],
  providers: [
    CompanyIntelligenceService,
    GetCompanyBriefUseCase,
    CompanyBriefOverviewService,
  ],
})
export class CompanyIntelligenceModule {}
