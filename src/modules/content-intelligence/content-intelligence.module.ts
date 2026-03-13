import { Module } from '@nestjs/common';
import { BlogModule } from '../blog/blog.module';
import { SourceRegistryModule } from '../source-registry/source-registry.module';
import { GetContentFeedUseCase } from './application/use-cases/get-content-feed.use-case';
import { GetContentTrendsUseCase } from './application/use-cases/get-content-trends.use-case';
import { ContentTopicExtractorService } from './domain/services/content-topic-extractor.service';
import { ContentIntelligenceController } from './content-intelligence.controller';
import { ContentIntelligenceService } from './content-intelligence.service';

@Module({
  imports: [BlogModule, SourceRegistryModule],
  controllers: [ContentIntelligenceController],
  providers: [
    ContentIntelligenceService,
    GetContentFeedUseCase,
    GetContentTrendsUseCase,
    ContentTopicExtractorService,
  ],
})
export class ContentIntelligenceModule {}
