import { Injectable } from '@nestjs/common';
import { JobPostingSnapshotReaderService } from '../../../jobs/application/services/job-posting-snapshot-reader.service';
import { GetSkillMapQueryDto } from '../../dto/get-skill-map-query.dto';
import { SkillMapResponseDto } from '../../dto/skill-map.response.dto';
import { SkillMapBuilderService } from '../../domain/services/skill-map-builder.service';

@Injectable()
export class GetSkillMapUseCase {
  constructor(
    private readonly jobPostingSnapshotReaderService: JobPostingSnapshotReaderService,
    private readonly skillMapBuilderService: SkillMapBuilderService,
  ) {}

  async execute(
    query: GetSkillMapQueryDto = {},
  ): Promise<SkillMapResponseDto> {
    const jobsEntry = query.company
      ? await this.jobPostingSnapshotReaderService.getResolvedCompanyJobs(
          query.company,
        )
      : await this.jobPostingSnapshotReaderService.getResolvedAllJobs();
    const jobs = jobsEntry?.jobs ?? [];

    return this.skillMapBuilderService.build({
      jobs,
      snapshot: jobsEntry?.snapshot,
      limit: query.limit ?? 20,
      minDemand: query.minDemand ?? 1,
      sampleLimit: query.sampleLimit ?? 3,
    });
  }
}
