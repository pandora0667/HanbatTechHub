import { ApiProperty } from '@nestjs/swagger';
import { SnapshotDto } from '../../../common/dto/snapshot.dto';
import { SourceRegistryItemDto } from '../../source-registry/dto/source-registry-response.dto';

class ComparedCompanySkillDto {
  @ApiProperty()
  skill: string;

  @ApiProperty()
  demandCount: number;

  @ApiProperty()
  companyCount: number;
}

class ComparedCompanyOverviewDto {
  @ApiProperty()
  openJobs: number;

  @ApiProperty()
  newJobs: number;

  @ApiProperty()
  updatedJobs: number;

  @ApiProperty()
  removedJobs: number;

  @ApiProperty()
  closingSoonJobs: number;

  @ApiProperty()
  latestContentItems: number;

  @ApiProperty()
  skillsTracked: number;

  @ApiProperty()
  skillCoverageRatio: number;
}

class ComparedCompanyIdentityDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  provider: string;
}

class ComparedCompanyDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: ComparedCompanyIdentityDto })
  company: ComparedCompanyIdentityDto;

  @ApiProperty({ type: ComparedCompanyOverviewDto })
  overview: ComparedCompanyOverviewDto;

  @ApiProperty({ type: [ComparedCompanySkillDto] })
  topSkills: ComparedCompanySkillDto[];

  @ApiProperty({ type: [SourceRegistryItemDto] })
  sources: SourceRegistryItemDto[];
}

class CompanyCompareOverviewDto {
  @ApiProperty()
  companyCount: number;

  @ApiProperty()
  totalOpenJobs: number;

  @ApiProperty()
  totalNewJobs: number;

  @ApiProperty()
  totalClosingSoonJobs: number;

  @ApiProperty()
  broadestSkillCoverageCompany: string;

  @ApiProperty()
  mostActiveHiringCompany: string;
}

export class CompanyCompareResponseDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: SnapshotDto, required: false })
  snapshot?: SnapshotDto;

  @ApiProperty({ type: CompanyCompareOverviewDto })
  overview: CompanyCompareOverviewDto;

  @ApiProperty({ type: [ComparedCompanyDto] })
  companies: ComparedCompanyDto[];
}
