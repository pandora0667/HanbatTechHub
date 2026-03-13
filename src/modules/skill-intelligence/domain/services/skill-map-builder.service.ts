import { Injectable } from '@nestjs/common';
import { JobPosting } from '../../../jobs/interfaces/job-posting.interface';
import { SkillSignalItem, SkillSignalResult } from '../models/skill-signal.model';
import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import { SkillNameNormalizerService } from './skill-name-normalizer.service';

interface BuildSkillMapParams {
  jobs: JobPosting[];
  snapshot?: SnapshotMetadata;
  generatedAt?: Date;
  limit: number;
  minDemand: number;
  sampleLimit: number;
}

@Injectable()
export class SkillMapBuilderService {
  constructor(
    private readonly skillNameNormalizerService: SkillNameNormalizerService,
  ) {}

  build(params: BuildSkillMapParams): SkillSignalResult {
    const generatedAt = (params.generatedAt ?? new Date()).toISOString();
    const jobsWithSkills = params.jobs.filter(
      (job) => (job.requirements.skills ?? []).length > 0,
    );
    const buckets = new Map<
      string,
      {
        companies: Set<JobPosting['company']>;
        roles: SkillSignalItem['sampleRoles'];
        roleIds: Set<string>;
        demandCount: number;
      }
    >();

    for (const job of params.jobs) {
      const uniqueSkills = new Set(
        (job.requirements.skills ?? [])
          .map((skill) => this.skillNameNormalizerService.normalize(skill))
          .filter((skill): skill is string => Boolean(skill)),
      );

      for (const skill of uniqueSkills) {
        const bucket =
          buckets.get(skill) ??
          {
            companies: new Set<JobPosting['company']>(),
            roles: [],
            roleIds: new Set<string>(),
            demandCount: 0,
          };

        bucket.demandCount += 1;
        bucket.companies.add(job.company);

        if (
          !bucket.roleIds.has(job.id) &&
          bucket.roles.length < params.sampleLimit
        ) {
          bucket.roleIds.add(job.id);
          bucket.roles.push({
            company: job.company,
            title: job.title,
            department: job.department,
            field: job.field,
            url: job.url,
          });
        }

        buckets.set(skill, bucket);
      }
    }

    const skills = Array.from(buckets.entries())
      .map<SkillSignalItem>(([skill, bucket]) => ({
        skill,
        demandCount: bucket.demandCount,
        companyCount: bucket.companies.size,
        companies: Array.from(bucket.companies).sort(),
        sampleRoles: bucket.roles,
      }))
      .filter((item) => item.demandCount >= params.minDemand)
      .sort((left, right) => {
        if (right.demandCount !== left.demandCount) {
          return right.demandCount - left.demandCount;
        }

        if (right.companyCount !== left.companyCount) {
          return right.companyCount - left.companyCount;
        }

        return left.skill.localeCompare(right.skill);
      })
      .slice(0, params.limit);

    return {
      generatedAt,
      snapshot: params.snapshot,
      summary: {
        totalJobs: params.jobs.length,
        jobsWithSkills: jobsWithSkills.length,
        coverageRatio:
          params.jobs.length > 0
            ? Number((jobsWithSkills.length / params.jobs.length).toFixed(2))
            : 0,
        totalSkills: skills.length,
      },
      skills,
    };
  }
}
