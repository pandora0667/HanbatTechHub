import { ApiProperty } from '@nestjs/swagger';
import { SnapshotDto } from '../../../common/dto/snapshot.dto';

class WorkspaceActionItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['apply', 'review', 'check', 'read'] })
  type: string;

  @ApiProperty({ enum: ['urgent', 'high', 'medium', 'low'] })
  priority: string;

  @ApiProperty({ enum: ['opportunity', 'institution', 'content'] })
  sourceKind: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  subtitle: string;

  @ApiProperty()
  reason: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ required: false })
  company?: string;

  @ApiProperty({ required: false })
  dueAt?: string;

  @ApiProperty({ type: [String] })
  labels: string[];
}

class ActWorkspaceOverviewDto {
  @ApiProperty()
  totalActions: number;

  @ApiProperty()
  urgent: number;

  @ApiProperty()
  high: number;

  @ApiProperty()
  medium: number;

  @ApiProperty()
  low: number;

  @ApiProperty()
  applyNow: number;

  @ApiProperty()
  readNow: number;
}

class ActWorkspaceSectionsDto {
  @ApiProperty({ type: [WorkspaceActionItemDto] })
  applyNow: WorkspaceActionItemDto[];

  @ApiProperty({ type: [WorkspaceActionItemDto] })
  reviewChanges: WorkspaceActionItemDto[];

  @ApiProperty({ type: [WorkspaceActionItemDto] })
  institutionChecks: WorkspaceActionItemDto[];

  @ApiProperty({ type: [WorkspaceActionItemDto] })
  institutionOpportunities: WorkspaceActionItemDto[];

  @ApiProperty({ type: [WorkspaceActionItemDto] })
  readingQueue: WorkspaceActionItemDto[];
}

export class ActWorkspaceResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: ActWorkspaceOverviewDto })
  overview: ActWorkspaceOverviewDto;

  @ApiProperty({ type: ActWorkspaceSectionsDto })
  sections: ActWorkspaceSectionsDto;

  @ApiProperty({ type: [WorkspaceActionItemDto] })
  actions: WorkspaceActionItemDto[];
}
