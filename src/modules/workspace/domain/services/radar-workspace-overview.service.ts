import { Injectable } from '@nestjs/common';
import { InstitutionOpportunityChangeSignalsResponseDto } from '../../../signals/dto/institution-opportunity-change-signals.response.dto';
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
  newInstitutionOpportunities: InstitutionOpportunityChangeSignalsResponseDto;
  updatedInstitutionOpportunities: InstitutionOpportunityChangeSignalsResponseDto;
  removedInstitutionOpportunities: InstitutionOpportunityChangeSignalsResponseDto;
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
      newInstitutionOpportunities:
        input.newInstitutionOpportunities.summary.total,
      updatedInstitutionOpportunities:
        input.updatedInstitutionOpportunities.summary.total,
      removedInstitutionOpportunities:
        input.removedInstitutionOpportunities.summary.total,
    };
  }
}
