import { Injectable } from '@nestjs/common';
import {
  JOBS_MARKET_HISTORY_FIELD_LIMIT,
  JOBS_MARKET_HISTORY_SKILL_LIMIT,
} from '../../constants/redis.constant';
import { JobPostingCacheEntry } from '../../application/ports/job-posting-cache.repository';
import {
  JobMarketHistoryCompanyItem,
  JobMarketHistoryEntry,
  JobMarketHistoryFieldItem,
  JobMarketHistorySkillItem,
} from '../models/job-market-history.model';

@Injectable()
export class JobMarketHistoryBuilderService {
  build(entry: JobPostingCacheEntry): JobMarketHistoryEntry {
    const companyStats = new Map<
      string,
      {
        company: string;
        openJobs: number;
        fields: Set<string>;
        skills: Set<string>;
      }
    >();
    const fieldStats = new Map<
      string,
      {
        field: string;
        openJobs: number;
        companies: Set<string>;
      }
    >();
    const skillStats = new Map<
      string,
      {
        label: string;
        demandCount: number;
        companies: Set<string>;
      }
    >();

    for (const job of entry.jobs) {
      const companyStat = companyStats.get(job.company) ?? {
        company: job.company,
        openJobs: 0,
        fields: new Set<string>(),
        skills: new Set<string>(),
      };
      companyStat.openJobs += 1;
      if (job.field?.trim()) {
        companyStat.fields.add(job.field.trim());
      }

      const normalizedSkills = this.extractNormalizedSkills(job.requirements.skills);
      for (const skill of normalizedSkills) {
        companyStat.skills.add(skill.label);
        const skillStat = skillStats.get(skill.key) ?? {
          label: skill.label,
          demandCount: 0,
          companies: new Set<string>(),
        };
        skillStat.demandCount += 1;
        skillStat.companies.add(job.company);
        skillStats.set(skill.key, skillStat);
      }
      companyStats.set(job.company, companyStat);

      if (job.field?.trim()) {
        const fieldKey = job.field.trim();
        const fieldStat = fieldStats.get(fieldKey) ?? {
          field: fieldKey,
          openJobs: 0,
          companies: new Set<string>(),
        };
        fieldStat.openJobs += 1;
        fieldStat.companies.add(job.company);
        fieldStats.set(fieldKey, fieldStat);
      }
    }

    const companies = Array.from(companyStats.values())
      .map<JobMarketHistoryCompanyItem>((stat) => ({
        company: stat.company as JobMarketHistoryCompanyItem['company'],
        openJobs: stat.openJobs,
        fields: stat.fields.size,
        skills: stat.skills.size,
      }))
      .sort((left, right) => {
        if (right.openJobs !== left.openJobs) {
          return right.openJobs - left.openJobs;
        }

        return left.company.localeCompare(right.company);
      });

    const fields = Array.from(fieldStats.values())
      .map<JobMarketHistoryFieldItem>((stat) => ({
        field: stat.field,
        openJobs: stat.openJobs,
        companies: stat.companies.size,
      }))
      .sort((left, right) => {
        if (right.openJobs !== left.openJobs) {
          return right.openJobs - left.openJobs;
        }

        return left.field.localeCompare(right.field);
      })
      .slice(0, JOBS_MARKET_HISTORY_FIELD_LIMIT);

    const skills = Array.from(skillStats.values())
      .map<JobMarketHistorySkillItem>((stat) => ({
        skill: stat.label,
        demandCount: stat.demandCount,
        companyCount: stat.companies.size,
      }))
      .sort((left, right) => {
        if (right.demandCount !== left.demandCount) {
          return right.demandCount - left.demandCount;
        }

        return left.skill.localeCompare(right.skill);
      })
      .slice(0, JOBS_MARKET_HISTORY_SKILL_LIMIT);

    return {
      snapshot: entry.snapshot,
      summary: {
        totalOpenOpportunities: entry.jobs.length,
        companiesHiring: companies.length,
        fieldsTracked: fieldStats.size,
        skillsTracked: skillStats.size,
      },
      companies,
      fields,
      skills,
    };
  }

  private extractNormalizedSkills(
    skills: string[] | undefined,
  ): Array<{ key: string; label: string }> {
    if (!skills || skills.length === 0) {
      return [];
    }

    const deduped = new Map<string, string>();

    for (const rawSkill of skills) {
      const normalized = this.normalizeSkill(rawSkill);

      if (!normalized) {
        continue;
      }

      if (!deduped.has(normalized.key)) {
        deduped.set(normalized.key, normalized.label);
      }
    }

    return Array.from(deduped.entries()).map(([key, label]) => ({ key, label }));
  }

  private normalizeSkill(
    rawSkill: string | undefined,
  ): { key: string; label: string } | null {
    if (!rawSkill) {
      return null;
    }

    const compact = rawSkill.replace(/\s+/g, ' ').trim();
    if (!compact) {
      return null;
    }

    const key = compact.toLowerCase();
    const label =
      compact.length <= 5 && compact === compact.toUpperCase()
        ? compact
        : compact
            .split(' ')
            .map((token) =>
              token.length <= 5 && token === token.toUpperCase()
                ? token
                : token.charAt(0).toUpperCase() + token.slice(1),
            )
            .join(' ');

    return { key, label };
  }
}
