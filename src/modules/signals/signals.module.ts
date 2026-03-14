import { Module } from '@nestjs/common';
import { SourceRegistryModule } from '../source-registry/source-registry.module';
import { JobsModule } from '../jobs/jobs.module';
import { BlogModule } from '../blog/blog.module';
import { NoticeModule } from '../notice/notice.module';
import { MenuModule } from '../menu/menu.module';
import { InstitutionIntelligenceModule } from '../institution-intelligence/institution-intelligence.module';
import { SignalsController } from './signals.controller';
import { SignalsService } from './signals.service';
import { SourceFreshnessEvaluatorService } from './domain/services/source-freshness-evaluator.service';
import { OpportunitySignalBuilderService } from './domain/services/opportunity-signal-builder.service';
import { InstitutionOpportunityChangeDetectorService } from './domain/services/institution-opportunity-change-detector.service';
import { SourceLastUpdateResolverService } from './application/services/source-last-update-resolver.service';
import { GetSourceFreshnessSignalsUseCase } from './application/use-cases/get-source-freshness-signals.use-case';
import { GetUpcomingOpportunitySignalsUseCase } from './application/use-cases/get-upcoming-opportunity-signals.use-case';
import { GetOpportunityChangeSignalsUseCase } from './application/use-cases/get-opportunity-change-signals.use-case';
import { GetInstitutionOpportunityChangeSignalsUseCase } from './application/use-cases/get-institution-opportunity-change-signals.use-case';

@Module({
  imports: [
    SourceRegistryModule,
    JobsModule,
    BlogModule,
    NoticeModule,
    MenuModule,
    InstitutionIntelligenceModule,
  ],
  controllers: [SignalsController],
  providers: [
    SignalsService,
    SourceFreshnessEvaluatorService,
    OpportunitySignalBuilderService,
    InstitutionOpportunityChangeDetectorService,
    SourceLastUpdateResolverService,
    GetSourceFreshnessSignalsUseCase,
    GetUpcomingOpportunitySignalsUseCase,
    GetOpportunityChangeSignalsUseCase,
    GetInstitutionOpportunityChangeSignalsUseCase,
  ],
  exports: [SignalsService],
})
export class SignalsModule {}
