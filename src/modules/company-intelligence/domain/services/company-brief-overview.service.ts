import { Injectable } from '@nestjs/common';
import { OpportunityChangeSignalsResponseDto } from '../../../signals/dto/opportunity-change-signals.response.dto';
import { UpcomingOpportunitySignalsResponseDto } from '../../../signals/dto/upcoming-opportunity-signals.response.dto';

@Injectable()
export class CompanyBriefOverviewService {
  build(input: {
    openJobs: number;
    latestContentItems: number;
    recentChanges: OpportunityChangeSignalsResponseDto;
    upcomingDeadlines: UpcomingOpportunitySignalsResponseDto;
  }) {
    return {
      openJobs: input.openJobs,
      newJobs: input.recentChanges.summary.created,
      updatedJobs: input.recentChanges.summary.updated,
      removedJobs: input.recentChanges.summary.removed,
      closingSoonJobs: input.upcomingDeadlines.summary.total,
      latestContentItems: input.latestContentItems,
    };
  }
}
