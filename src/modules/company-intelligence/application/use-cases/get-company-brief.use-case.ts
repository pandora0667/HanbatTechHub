import { Inject, Injectable } from '@nestjs/common';
import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import {
  buildSnapshotMetadata,
  mergeSnapshotMetadata,
} from '../../../../common/utils/snapshot.util';
import {
  BLOG_SOURCE_CONFIDENCE,
  DEFAULT_REDIS_TTL,
} from '../../../blog/constants/blog.constant';
import {
  BLOG_POST_REPOSITORY,
  BlogPostRepository,
} from '../../../blog/application/ports/blog-post.repository';
import { BlogPost } from '../../../blog/interfaces/blog.interface';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { SignalsService } from '../../../signals/signals.service';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../../../jobs/application/ports/job-posting-cache.repository';
import { CompanyType, JobPosting } from '../../../jobs/interfaces/job-posting.interface';
import { getJobSourceDescriptor } from '../../../jobs/constants/job-source.constant';
import { GetCompanyBriefQueryDto } from '../../dto/get-company-brief-query.dto';
import { CompanyBriefResponseDto } from '../../dto/company-brief.response.dto';
import { CompanyBriefOverviewService } from '../../domain/services/company-brief-overview.service';
import { getCompanyContentSource } from '../../constants/company-content-source-map.constant';

@Injectable()
export class GetCompanyBriefUseCase {
  constructor(
    @Inject(JOB_POSTING_CACHE_REPOSITORY)
    private readonly jobPostingCacheRepository: JobPostingCacheRepository,
    @Inject(BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: BlogPostRepository,
    private readonly signalsService: SignalsService,
    private readonly sourceRegistryService: SourceRegistryService,
    private readonly companyBriefOverviewService: CompanyBriefOverviewService,
  ) {}

  async execute(
    company: CompanyType,
    query: GetCompanyBriefQueryDto = {},
  ): Promise<CompanyBriefResponseDto> {
    const jobSource = getJobSourceDescriptor(company);
    const contentSource = getCompanyContentSource(company);
    const [jobEntry, recentChanges, upcomingDeadlines, latestContent] =
      await Promise.all([
        this.jobPostingCacheRepository.getCompanyJobs(company),
        this.signalsService.getOpportunityChangeSignals({
          company,
          limit: query.changeLimit,
        }),
        this.signalsService.getUpcomingOpportunitySignals({
          company,
          limit: query.deadlineLimit,
          days: query.deadlineWindowDays,
        }),
        contentSource
          ? this.getLatestContent(
              contentSource.blogCode,
              contentSource.sourceId,
              query.contentLimit ?? 3,
            )
          : Promise.resolve({
              available: false,
              items: [] as BlogPost[],
              snapshot: undefined as SnapshotMetadata | undefined,
            }),
      ]);
    const generatedAt = new Date().toISOString();
    const snapshot = mergeSnapshotMetadata(
      [
        jobEntry?.snapshot,
        latestContent.snapshot,
        recentChanges.snapshot,
        upcomingDeadlines.snapshot,
      ].filter((entry): entry is SnapshotMetadata => entry !== undefined),
    );
    const sources = this.resolveSources([
      jobSource.id,
      contentSource?.sourceId,
    ]);
    const openJobs = jobEntry?.jobs ?? [];
    const latestJobs = openJobs
      .slice()
      .sort(
        (left, right) =>
          new Date(left.period.end).getTime() - new Date(right.period.end).getTime(),
      )
      .slice(0, query.jobLimit ?? 5);

    return {
      generatedAt,
      company: {
        code: company,
        name: jobSource.name,
        provider: jobSource.provider,
      },
      snapshot,
      overview: this.companyBriefOverviewService.build({
        openJobs: openJobs.length,
        latestContentItems: latestContent.items.length,
        recentChanges,
        upcomingDeadlines,
      }),
      sections: {
        jobs: {
          items: latestJobs.map((job) => this.toJobDto(job)),
          snapshot: jobEntry?.snapshot,
        },
        latestContent: {
          available: latestContent.available,
          items: latestContent.items.map((post) => this.toContentDto(post)),
          snapshot: latestContent.snapshot,
        },
        recentChanges,
        upcomingDeadlines,
        sources,
      },
    };
  }

  private async getLatestContent(
    companyCode: string,
    sourceId: string,
    limit: number,
  ) {
    const posts = await this.blogPostRepository.getCompanyPosts(companyCode);
    const lastUpdate = await this.blogPostRepository.getCompanyLastUpdate(companyCode);
    const items = posts
      .slice()
      .sort(
        (left, right) =>
          new Date(right.publishDate).getTime() -
          new Date(left.publishDate).getTime(),
      )
      .slice(0, limit);

    return {
      available: true,
      items,
      snapshot: lastUpdate
        ? buildSnapshotMetadata({
            collectedAt: lastUpdate,
            ttlSeconds: DEFAULT_REDIS_TTL,
            confidence: BLOG_SOURCE_CONFIDENCE,
            sourceIds: [sourceId],
          })
        : undefined,
    };
  }

  private resolveSources(sourceIds: Array<string | undefined>) {
    const sourceIdSet = new Set(sourceIds.filter(Boolean));
    return this.sourceRegistryService
      .list()
      .filter((source) => sourceIdSet.has(source.id))
      .sort((left, right) => left.id.localeCompare(right.id));
  }

  private toJobDto(job: JobPosting) {
    return {
      id: job.id,
      title: job.title,
      department: job.department,
      field: job.field,
      locations: [...job.locations],
      deadline: new Date(job.period.end).toISOString(),
      url: job.url,
    };
  }

  private toContentDto(post: BlogPost) {
    return {
      id: post.id,
      title: post.title,
      description: post.description,
      link: post.link,
      author: post.author,
      publishDate: new Date(post.publishDate).toISOString(),
    };
  }
}
