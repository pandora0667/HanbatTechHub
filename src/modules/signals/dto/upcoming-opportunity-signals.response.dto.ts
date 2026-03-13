import { ApiProperty } from '@nestjs/swagger';
import { SnapshotDto } from '../../../common/dto/snapshot.dto';

class OpportunitySignalSummaryDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  closingToday: number;

  @ApiProperty()
  closingSoon: number;

  @ApiProperty()
  watch: number;

  @ApiProperty()
  windowDays: number;
}

class OpportunitySignalDto {
  @ApiProperty({ enum: ['job_deadline'] })
  type: string;

  @ApiProperty({ enum: ['closing_today', 'closing_soon', 'watch'] })
  severity: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  company: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  department: string;

  @ApiProperty()
  field: string;

  @ApiProperty()
  deadline: string;

  @ApiProperty()
  daysRemaining: number;

  @ApiProperty()
  url: string;

  @ApiProperty({ type: [String] })
  locations: string[];
}

export class UpcomingOpportunitySignalsResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: OpportunitySignalSummaryDto })
  summary: OpportunitySignalSummaryDto;

  @ApiProperty({ type: [OpportunitySignalDto] })
  signals: OpportunitySignalDto[];
}
