import { Injectable } from '@nestjs/common';
import { BlogPost } from '../../../blog/interfaces/blog.interface';
import { JobPosting } from '../../../jobs/interfaces/job-posting.interface';

interface WatchlistChangeSignal {
  jobId: string;
  company: string;
  title: string;
}

interface WatchlistDeadlineSignal {
  id: string;
  company: string;
  title: string;
}

interface WatchlistCriteria {
  companies: Set<string>;
  skills: Set<string>;
  keyword?: string;
}

@Injectable()
export class WatchlistPreviewMatcherService {
  matchesJob(job: JobPosting, criteria: WatchlistCriteria): boolean {
    const companyMatch =
      criteria.companies.size === 0 || criteria.companies.has(job.company);
    const skillMatch =
      criteria.skills.size === 0 ||
      (job.requirements.skills ?? []).some((skill) =>
        criteria.skills.has(skill.toLowerCase()),
      );
    const keywordMatch =
      !criteria.keyword || this.matchesText(this.toJobText(job), criteria.keyword);

    return companyMatch && skillMatch && keywordMatch;
  }

  matchesPost(post: BlogPost, criteria: WatchlistCriteria): boolean {
    const companyMatch =
      criteria.companies.size === 0 ||
      criteria.companies.has(post.company) ||
      this.matchesMappedCompany(post.company, criteria.companies);
    const skillMatch =
      criteria.skills.size === 0 ||
      Array.from(criteria.skills).some((skill) =>
        this.matchesText(`${post.title} ${post.description}`, skill),
      );
    const keywordMatch =
      !criteria.keyword ||
      this.matchesText(`${post.title} ${post.description}`, criteria.keyword);

    return companyMatch && skillMatch && keywordMatch;
  }

  matchesChangeSignal(
    signal: WatchlistChangeSignal,
    jobIndex: Map<string, JobPosting>,
    criteria: WatchlistCriteria,
  ): boolean {
    const relatedJob = jobIndex.get(signal.jobId);

    if (relatedJob) {
      return this.matchesJob(relatedJob, criteria);
    }

    const companyMatch =
      criteria.companies.size === 0 || criteria.companies.has(signal.company);
    const keywordMatch =
      !criteria.keyword || this.matchesText(signal.title, criteria.keyword);

    return companyMatch && keywordMatch;
  }

  matchesDeadlineSignal(
    signal: WatchlistDeadlineSignal,
    jobIndex: Map<string, JobPosting>,
    criteria: WatchlistCriteria,
  ): boolean {
    const relatedJob = jobIndex.get(signal.id);

    if (relatedJob) {
      return this.matchesJob(relatedJob, criteria);
    }

    const companyMatch =
      criteria.companies.size === 0 || criteria.companies.has(signal.company);
    const keywordMatch =
      !criteria.keyword || this.matchesText(signal.title, criteria.keyword);

    return companyMatch && keywordMatch;
  }

  private matchesMappedCompany(companyCode: string, companies: Set<string>): boolean {
    const normalized = companyCode.toUpperCase();

    if (normalized.includes('NAVER') && companies.has('NAVER')) {
      return true;
    }

    if (normalized.includes('KAKAO') && companies.has('KAKAO')) {
      return true;
    }

    if (normalized.includes('LINE') && companies.has('LINE')) {
      return true;
    }

    if (normalized.includes('WOOWA') && companies.has('BAEMIN')) {
      return true;
    }

    if (normalized.includes('DAANGN') && companies.has('DANGGN')) {
      return true;
    }

    if (normalized.includes('TOSS') && companies.has('TOSS')) {
      return true;
    }

    return false;
  }

  private matchesText(text: string, keyword: string): boolean {
    return text.toLowerCase().includes(keyword.toLowerCase());
  }

  private toJobText(job: JobPosting): string {
    return [
      job.title,
      job.department,
      job.field,
      job.description ?? '',
      ...(job.tags ?? []),
      ...(job.requirements.skills ?? []),
    ].join(' ');
  }
}
