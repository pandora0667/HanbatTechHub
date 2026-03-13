import { Injectable } from '@nestjs/common';
import { OpportunityChangeSignalsResponseDto } from '../../../signals/dto/opportunity-change-signals.response.dto';
import { SourceFreshnessSignalsResponseDto } from '../../../signals/dto/source-freshness-signals.response.dto';
import { UpcomingOpportunitySignalsResponseDto } from '../../../signals/dto/upcoming-opportunity-signals.response.dto';

interface BuildRadarWorkspaceOverviewInput {
  staleSources: SourceFreshnessSignalsResponseDto;
  missingSources: SourceFreshnessSignalsResponseDto;
  newOpportunities: OpportunityChangeSignalsResponseDto;
  updatedOpportunities: OpportunityChangeSignalsResponseDto;
  removedOpportunities: OpportunityChangeSignalsResponseDto;
  upcomingDeadlines: UpcomingOpportunitySignalsResponseDto;
}

@Injectable()
export class RadarWorkspaceOverviewService {
  build(input: BuildRadarWorkspaceOverviewInput) {
    return {
      staleSources: input.staleSources.signals.length,
      missingSources: input.missingSources.signals.length,
      newOpportunities: input.newOpportunities.summary.total,
      updatedOpportunities: input.updatedOpportunities.summary.total,
      removedOpportunities: input.removedOpportunities.summary.total,
      closingSoonOpportunities: input.upcomingDeadlines.summary.total,
    };
  }
}
