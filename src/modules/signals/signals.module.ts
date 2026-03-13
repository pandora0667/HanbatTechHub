import { Module } from '@nestjs/common';
import { SourceRegistryModule } from '../source-registry/source-registry.module';
import { JobsModule } from '../jobs/jobs.module';
import { BlogModule } from '../blog/blog.module';
import { NoticeModule } from '../notice/notice.module';
import { MenuModule } from '../menu/menu.module';
import { SignalsController } from './signals.controller';
import { SignalsService } from './signals.service';
import { SourceFreshnessEvaluatorService } from './domain/services/source-freshness-evaluator.service';
import { OpportunitySignalBuilderService } from './domain/services/opportunity-signal-builder.service';
import { SourceLastUpdateResolverService } from './application/services/source-last-update-resolver.service';
import { GetSourceFreshnessSignalsUseCase } from './application/use-cases/get-source-freshness-signals.use-case';
import { GetUpcomingOpportunitySignalsUseCase } from './application/use-cases/get-upcoming-opportunity-signals.use-case';

@Module({
  imports: [SourceRegistryModule, JobsModule, BlogModule, NoticeModule, MenuModule],
  controllers: [SignalsController],
  providers: [
    SignalsService,
    SourceFreshnessEvaluatorService,
    OpportunitySignalBuilderService,
    SourceLastUpdateResolverService,
    GetSourceFreshnessSignalsUseCase,
    GetUpcomingOpportunitySignalsUseCase,
  ],
})
export class SignalsModule {}
