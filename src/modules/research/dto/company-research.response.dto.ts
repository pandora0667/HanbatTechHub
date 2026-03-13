import { ApiProperty } from '@nestjs/swagger';
import { SnapshotDto } from '../../../common/dto/snapshot.dto';
import { SourceRegistryItemDto } from '../../source-registry/dto/source-registry-response.dto';

class CompanyResearchIdentityDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  provider: string;
}

class CompanyResearchThesisDto {
  @ApiProperty()
  headline: string;

  @ApiProperty()
  summary: string;
}

class CompanyResearchInsightDto {
  @ApiProperty({
    enum: ['hiring', 'skills', 'content', 'momentum'],
  })
  type: string;

  @ApiProperty()
  headline: string;

  @ApiProperty()
  summary: string;

  @ApiProperty({ type: [String] })
  evidence: string[];

  @ApiProperty()
  confidence: number;
}

class CompanyResearchActionDto {
  @ApiProperty({
    enum: ['apply', 'review', 'read', 'watch'],
  })
  type: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  reason: string;

  @ApiProperty({ required: false })
  url?: string;
}

export class CompanyResearchResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: CompanyResearchIdentityDto })
  company: CompanyResearchIdentityDto;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: CompanyResearchThesisDto })
  thesis: CompanyResearchThesisDto;

  @ApiProperty({ type: [CompanyResearchInsightDto] })
  insights: CompanyResearchInsightDto[];

  @ApiProperty({ type: [CompanyResearchActionDto] })
  actions: CompanyResearchActionDto[];

  @ApiProperty({ type: [SourceRegistryItemDto] })
  sources: SourceRegistryItemDto[];
}
