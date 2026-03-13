import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { SignalsModule } from '../signals/signals.module';
import { SkillIntelligenceModule } from '../skill-intelligence/skill-intelligence.module';
import { SourceRegistryModule } from '../source-registry/source-registry.module';
import { GetMarketOverviewUseCase } from './application/use-cases/get-market-overview.use-case';
import { MarketOverviewBuilderService } from './domain/services/market-overview-builder.service';
import { MarketIntelligenceController } from './market-intelligence.controller';
import { MarketIntelligenceService } from './market-intelligence.service';

@Module({
  imports: [JobsModule, SignalsModule, SkillIntelligenceModule, SourceRegistryModule],
  controllers: [MarketIntelligenceController],
  providers: [
    MarketIntelligenceService,
    GetMarketOverviewUseCase,
    MarketOverviewBuilderService,
  ],
})
export class MarketIntelligenceModule {}
