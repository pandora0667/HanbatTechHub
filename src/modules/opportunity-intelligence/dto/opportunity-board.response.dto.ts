import { ApiProperty } from '@nestjs/swagger';
import { SnapshotDto } from '../../../common/dto/snapshot.dto';
import { SourceRegistryItemDto } from '../../source-registry/dto/source-registry-response.dto';

class OpportunityBoardSignalDto {
  @ApiProperty()
  isNew: boolean;

  @ApiProperty()
  isUpdated: boolean;

  @ApiProperty()
  closesSoon: boolean;

  @ApiProperty()
  daysRemaining: number;
}

class OpportunityBoardItemDto {
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
  career: string;

  @ApiProperty()
  employmentType: string;

  @ApiProperty({ type: [String] })
  locations: string[];

  @ApiProperty({ type: [String] })
  skills: string[];

  @ApiProperty()
  deadline: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ type: OpportunityBoardSignalDto })
  signal: OpportunityBoardSignalDto;
}

class OpportunityBoardSummaryDto {
  @ApiProperty()
  totalOpenOpportunities: number;

  @ApiProperty()
  companies: number;

  @ApiProperty()
  closingSoon: number;

  @ApiProperty()
  newSignals: number;

  @ApiProperty()
  updatedSignals: number;
}

class OpportunityBoardMetaDto {
  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;

  @ApiProperty()
  sort: string;

  @ApiProperty()
  deadlineWindowDays: number;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;
}

export class OpportunityBoardResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: OpportunityBoardSummaryDto })
  summary: OpportunityBoardSummaryDto;

  @ApiProperty({ type: OpportunityBoardMetaDto })
  meta: OpportunityBoardMetaDto;

  @ApiProperty({ type: [OpportunityBoardItemDto] })
  items: OpportunityBoardItemDto[];

  @ApiProperty({ type: [SourceRegistryItemDto] })
  sources: SourceRegistryItemDto[];
}
