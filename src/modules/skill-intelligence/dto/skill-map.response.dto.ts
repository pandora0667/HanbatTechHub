import { ApiProperty } from '@nestjs/swagger';
import { SnapshotDto } from '../../../common/dto/snapshot.dto';

class SkillMapSummaryDto {
  @ApiProperty()
  totalJobs: number;

  @ApiProperty()
  jobsWithSkills: number;

  @ApiProperty()
  coverageRatio: number;

  @ApiProperty()
  totalSkills: number;
}

class SkillMapSampleRoleDto {
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
}

class SkillMapItemDto {
  @ApiProperty()
  skill: string;

  @ApiProperty()
  demandCount: number;

  @ApiProperty()
  companyCount: number;

  @ApiProperty({ type: [String] })
  companies: string[];

  @ApiProperty({ type: [SkillMapSampleRoleDto] })
  sampleRoles: SkillMapSampleRoleDto[];
}

export class SkillMapResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: SkillMapSummaryDto })
  summary: SkillMapSummaryDto;

  @ApiProperty({ type: [SkillMapItemDto] })
  skills: SkillMapItemDto[];
}
