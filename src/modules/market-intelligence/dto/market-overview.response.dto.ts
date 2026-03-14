import { ApiProperty } from '@nestjs/swagger';
import { SnapshotDto } from '../../../common/dto/snapshot.dto';
import { SourceRegistryItemDto } from '../../source-registry/dto/source-registry-response.dto';

class MarketOverviewSummaryDto {
  @ApiProperty()
  totalOpenOpportunities: number;

  @ApiProperty()
  companiesHiring: number;

  @ApiProperty()
  fieldsTracked: number;

  @ApiProperty()
  skillsTracked: number;

  @ApiProperty()
  newSignals: number;

  @ApiProperty()
  updatedSignals: number;

  @ApiProperty()
  closingSoonOpportunities: number;

  @ApiProperty()
  freshSources: number;

  @ApiProperty()
  staleSources: number;

  @ApiProperty()
  missingSources: number;

  @ApiProperty()
  historyPoints: number;
}

class MarketCompanyLeaderboardItemDto {
  @ApiProperty()
  company: string;

  @ApiProperty()
  openJobs: number;

  @ApiProperty()
  newJobs: number;

  @ApiProperty()
  updatedJobs: number;

  @ApiProperty()
  closingSoonJobs: number;
}

class MarketSkillLeaderboardItemDto {
  @ApiProperty()
  skill: string;

  @ApiProperty()
  demandCount: number;

  @ApiProperty()
  companyCount: number;
}

class MarketFieldLeaderboardItemDto {
  @ApiProperty()
  field: string;

  @ApiProperty()
  openJobs: number;

  @ApiProperty()
  companies: number;
}

class MarketStaleSourceItemDto {
  @ApiProperty()
  sourceId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  provider: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  confidence: number;

  @ApiProperty({ required: false })
  collectedAt?: string;
}

class MarketTrendTimelinePointDto {
  @ApiProperty()
  collectedAt: string;

  @ApiProperty()
  totalOpenOpportunities: number;

  @ApiProperty()
  companiesHiring: number;
}

class MarketTrendSummaryDto {
  @ApiProperty()
  historyPoints: number;

  @ApiProperty({ required: false })
  baselineCollectedAt?: string;

  @ApiProperty({ required: false })
  latestCollectedAt?: string;

  @ApiProperty()
  totalOpenOpportunitiesDelta: number;

  @ApiProperty()
  companiesHiringDelta: number;

  @ApiProperty()
  fieldsTrackedDelta: number;

  @ApiProperty()
  skillsTrackedDelta: number;
}

class MarketMomentumItemDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  currentCount: number;

  @ApiProperty()
  baselineCount: number;

  @ApiProperty()
  delta: number;

  @ApiProperty({ enum: ['up', 'down', 'flat'] })
  direction: 'up' | 'down' | 'flat';
}

class MarketTrendSectionDto {
  @ApiProperty({ type: MarketTrendSummaryDto })
  summary: MarketTrendSummaryDto;

  @ApiProperty({ type: [MarketTrendTimelinePointDto] })
  timeline: MarketTrendTimelinePointDto[];

  @ApiProperty({ type: [MarketMomentumItemDto] })
  companyMomentum: MarketMomentumItemDto[];

  @ApiProperty({ type: [MarketMomentumItemDto] })
  fieldMomentum: MarketMomentumItemDto[];

  @ApiProperty({ type: [MarketMomentumItemDto] })
  skillMomentum: MarketMomentumItemDto[];
}

class MarketOverviewSectionsDto {
  @ApiProperty({ type: [MarketCompanyLeaderboardItemDto] })
  topCompanies: MarketCompanyLeaderboardItemDto[];

  @ApiProperty({ type: [MarketSkillLeaderboardItemDto] })
  topSkills: MarketSkillLeaderboardItemDto[];

  @ApiProperty({ type: [MarketFieldLeaderboardItemDto] })
  topFields: MarketFieldLeaderboardItemDto[];

  @ApiProperty({ type: [MarketStaleSourceItemDto] })
  staleSources: MarketStaleSourceItemDto[];

  @ApiProperty({ type: MarketTrendSectionDto })
  trends: MarketTrendSectionDto;
}

export class MarketOverviewResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: MarketOverviewSummaryDto })
  summary: MarketOverviewSummaryDto;

  @ApiProperty({ type: MarketOverviewSectionsDto })
  sections: MarketOverviewSectionsDto;

  @ApiProperty({ type: [SourceRegistryItemDto] })
  sources: SourceRegistryItemDto[];
}
