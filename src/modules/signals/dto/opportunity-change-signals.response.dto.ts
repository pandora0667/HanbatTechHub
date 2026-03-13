import { ApiProperty } from '@nestjs/swagger';
import { SnapshotDto } from '../../../common/dto/snapshot.dto';

class OpportunityChangeSummaryDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  created: number;

  @ApiProperty()
  updated: number;

  @ApiProperty()
  removed: number;
}

class OpportunityChangeSignalDto {
  @ApiProperty({ enum: ['job_change'] })
  type: string;

  @ApiProperty({ enum: ['new', 'updated', 'removed'] })
  changeType: string;

  @ApiProperty()
  jobId: string;

  @ApiProperty()
  company: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  department: string;

  @ApiProperty()
  field: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ type: [String] })
  locations: string[];

  @ApiProperty()
  deadline: string;

  @ApiProperty({ type: [String], required: false })
  changedFields?: string[];
}

export class OpportunityChangeSignalsResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ required: false })
  baselineCollectedAt?: string;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: OpportunityChangeSummaryDto })
  summary: OpportunityChangeSummaryDto;

  @ApiProperty({ type: [OpportunityChangeSignalDto] })
  signals: OpportunityChangeSignalDto[];
}
