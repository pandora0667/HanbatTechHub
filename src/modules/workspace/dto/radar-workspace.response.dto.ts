import { ApiProperty } from '@nestjs/swagger';
import { SnapshotDto } from '../../../common/dto/snapshot.dto';
import { InstitutionOpportunityChangeSignalsResponseDto } from '../../signals/dto/institution-opportunity-change-signals.response.dto';
import { OpportunityChangeSignalsResponseDto } from '../../signals/dto/opportunity-change-signals.response.dto';
import { SourceFreshnessSignalsResponseDto } from '../../signals/dto/source-freshness-signals.response.dto';
import { UpcomingOpportunitySignalsResponseDto } from '../../signals/dto/upcoming-opportunity-signals.response.dto';

class RadarWorkspaceOverviewDto {
  @ApiProperty()
  staleSources: number;

  @ApiProperty()
  missingSources: number;

  @ApiProperty()
  newOpportunities: number;

  @ApiProperty()
  updatedOpportunities: number;

  @ApiProperty()
  removedOpportunities: number;

  @ApiProperty()
  closingSoonOpportunities: number;

  @ApiProperty()
  newInstitutionOpportunities: number;

  @ApiProperty()
  updatedInstitutionOpportunities: number;

  @ApiProperty()
  removedInstitutionOpportunities: number;
}

class RadarWorkspaceSectionsDto {
  @ApiProperty({ type: SourceFreshnessSignalsResponseDto })
  staleSources: SourceFreshnessSignalsResponseDto;

  @ApiProperty({ type: SourceFreshnessSignalsResponseDto })
  missingSources: SourceFreshnessSignalsResponseDto;

  @ApiProperty({ type: OpportunityChangeSignalsResponseDto })
  newOpportunities: OpportunityChangeSignalsResponseDto;

  @ApiProperty({ type: OpportunityChangeSignalsResponseDto })
  updatedOpportunities: OpportunityChangeSignalsResponseDto;

  @ApiProperty({ type: OpportunityChangeSignalsResponseDto })
  removedOpportunities: OpportunityChangeSignalsResponseDto;

  @ApiProperty({ type: UpcomingOpportunitySignalsResponseDto })
  upcomingDeadlines: UpcomingOpportunitySignalsResponseDto;

  @ApiProperty({ type: InstitutionOpportunityChangeSignalsResponseDto })
  newInstitutionOpportunities: InstitutionOpportunityChangeSignalsResponseDto;

  @ApiProperty({ type: InstitutionOpportunityChangeSignalsResponseDto })
  updatedInstitutionOpportunities: InstitutionOpportunityChangeSignalsResponseDto;

  @ApiProperty({ type: InstitutionOpportunityChangeSignalsResponseDto })
  removedInstitutionOpportunities: InstitutionOpportunityChangeSignalsResponseDto;
}

export class RadarWorkspaceResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: RadarWorkspaceOverviewDto })
  overview: RadarWorkspaceOverviewDto;

  @ApiProperty({ type: RadarWorkspaceSectionsDto })
  sections: RadarWorkspaceSectionsDto;
}
