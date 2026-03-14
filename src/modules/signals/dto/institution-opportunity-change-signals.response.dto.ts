import { ApiProperty } from '@nestjs/swagger';
import { SnapshotDto } from '../../../common/dto/snapshot.dto';
import { InstitutionOpportunityChangeType } from '../domain/models/institution-opportunity-change-signal.model';

class InstitutionOpportunityChangeSummaryDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  created: number;

  @ApiProperty()
  updated: number;

  @ApiProperty()
  removed: number;
}

class InstitutionOpportunityChangeSignalDto {
  @ApiProperty({ enum: ['institution_opportunity_change'] })
  type: string;

  @ApiProperty({ enum: ['new', 'updated', 'removed'] })
  changeType: InstitutionOpportunityChangeType;

  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  institutionId: string;

  @ApiProperty()
  institutionName: string;

  @ApiProperty()
  region: string;

  @ApiProperty()
  serviceType: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  pageUrl: string;

  @ApiProperty({ enum: ['live', 'catalog_fallback'] })
  discoveryMode: string;

  @ApiProperty()
  sourceId: string;

  @ApiProperty({ type: [String], required: false })
  changedFields?: string[];
}

export class InstitutionOpportunityChangeSignalsResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ required: false })
  baselineCollectedAt?: string;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: InstitutionOpportunityChangeSummaryDto })
  summary: InstitutionOpportunityChangeSummaryDto;

  @ApiProperty({ type: [InstitutionOpportunityChangeSignalDto] })
  signals: InstitutionOpportunityChangeSignalDto[];
}
