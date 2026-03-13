import { Inject, Injectable } from '@nestjs/common';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../../../jobs/application/ports/job-posting-cache.repository';
import { GetSkillMapQueryDto } from '../../dto/get-skill-map-query.dto';
import { SkillMapResponseDto } from '../../dto/skill-map.response.dto';
import { SkillMapBuilderService } from '../../domain/services/skill-map-builder.service';

@Injectable()
export class GetSkillMapUseCase {
  constructor(
    @Inject(JOB_POSTING_CACHE_REPOSITORY)
    private readonly jobPostingCacheRepository: JobPostingCacheRepository,
    private readonly skillMapBuilderService: SkillMapBuilderService,
  ) {}

  async execute(
    query: GetSkillMapQueryDto = {},
  ): Promise<SkillMapResponseDto> {
    const allJobs = await this.jobPostingCacheRepository.getAllJobs();
    const jobs = query.company
      ? (allJobs?.jobs ?? []).filter((job) => job.company === query.company)
      : (allJobs?.jobs ?? []);

    return this.skillMapBuilderService.build({
      jobs,
      snapshot: allJobs?.snapshot,
      limit: query.limit ?? 20,
      minDemand: query.minDemand ?? 1,
      sampleLimit: query.sampleLimit ?? 3,
    });
  }
}
