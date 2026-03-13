import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { SourceRegistryModule } from '../source-registry/source-registry.module';
import { GetOpportunityBoardUseCase } from './application/use-cases/get-opportunity-board.use-case';
import { OpportunityIntelligenceController } from './opportunity-intelligence.controller';
import { OpportunityIntelligenceService } from './opportunity-intelligence.service';

@Module({
  imports: [JobsModule, SourceRegistryModule],
  controllers: [OpportunityIntelligenceController],
  providers: [OpportunityIntelligenceService, GetOpportunityBoardUseCase],
})
export class OpportunityIntelligenceModule {}
