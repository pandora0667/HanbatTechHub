import { Module } from '@nestjs/common';
import { BlogModule } from '../blog/blog.module';
import { CompanyIntelligenceModule } from '../company-intelligence/company-intelligence.module';
import { JobsModule } from '../jobs/jobs.module';
import { SignalsModule } from '../signals/signals.module';
import { SourceRegistryModule } from '../source-registry/source-registry.module';
import { GetWatchlistPreviewUseCase } from './application/use-cases/get-watchlist-preview.use-case';
import { WatchlistPreviewMatcherService } from './domain/services/watchlist-preview-matcher.service';
import { WatchlistPreviewController } from './watchlist-preview.controller';
import { WatchlistPreviewService } from './watchlist-preview.service';

@Module({
  imports: [JobsModule, BlogModule, CompanyIntelligenceModule, SignalsModule, SourceRegistryModule],
  controllers: [WatchlistPreviewController],
  providers: [
    WatchlistPreviewService,
    GetWatchlistPreviewUseCase,
    WatchlistPreviewMatcherService,
  ],
})
export class WatchlistPreviewModule {}
