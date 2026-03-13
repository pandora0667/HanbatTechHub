import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import {
  buildSnapshotMetadata,
  mergeSnapshotMetadata,
} from '../../../../common/utils/snapshot.util';
import {
  BLOG_POST_REPOSITORY,
  BlogPostRepository,
} from '../../../blog/application/ports/blog-post.repository';
import {
  BLOG_SOURCE_CATALOG,
  BlogSourceCatalog,
} from '../../../blog/application/ports/blog-source-catalog';
import {
  BLOG_SOURCE_CONFIDENCE,
  DEFAULT_REDIS_TTL,
  getBlogSourceId,
} from '../../../blog/constants/blog.constant';
import { BlogPost } from '../../../blog/interfaces/blog.interface';
import { CompanyIntelligenceService } from '../../../company-intelligence/company-intelligence.service';
import {
  COMPANY_CONTENT_SOURCE_MAP,
  getCompanyContentSource,
} from '../../../company-intelligence/constants/company-content-source-map.constant';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../../../jobs/application/ports/job-posting-cache.repository';
import { JobPosting } from '../../../jobs/interfaces/job-posting.interface';
import { SignalsService } from '../../../signals/signals.service';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { GetWatchlistPreviewQueryDto } from '../../dto/get-watchlist-preview-query.dto';
import { WatchlistPreviewResponseDto } from '../../dto/watchlist-preview.response.dto';
import { WatchlistPreviewMatcherService } from '../../domain/services/watchlist-preview-matcher.service';

@Injectable()
export class GetWatchlistPreviewUseCase {
  constructor(
    @Inject(JOB_POSTING_CACHE_REPOSITORY)
    private readonly jobPostingCacheRepository: JobPostingCacheRepository,
    @Inject(BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: BlogPostRepository,
    @Inject(BLOG_SOURCE_CATALOG)
    private readonly blogSourceCatalog: BlogSourceCatalog,
    private readonly companyIntelligenceService: CompanyIntelligenceService,
    private readonly signalsService: SignalsService,
    private readonly sourceRegistryService: SourceRegistryService,
    private readonly watchlistPreviewMatcherService: WatchlistPreviewMatcherService,
  ) {}

  async execute(
    query: GetWatchlistPreviewQueryDto,
  ): Promise<WatchlistPreviewResponseDto> {
    const companies = Array.from(new Set(query.companies ?? []));
    const skills = Array.from(
      new Set((query.skills ?? []).map((skill) => skill.trim()).filter(Boolean)),
    );
    const keyword = query.keyword?.trim();

    if (companies.length === 0 && skills.length === 0 && !keyword) {
      throw new BadRequestException(
        'At least one company, skill, or keyword is required.',
      );
    }

    const criteria = {
      companies: new Set(companies),
      skills: new Set(skills.map((skill) => skill.toLowerCase())),
      keyword,
    };
    const [allJobsEntry, changeSignals, deadlineSignals, companyBriefs] =
      await Promise.all([
        this.jobPostingCacheRepository.getAllJobs(),
        this.signalsService.getOpportunityChangeSignals({ limit: 500 }),
        this.signalsService.getUpcomingOpportunitySignals({
          days: query.deadlineWindowDays,
          limit: 500,
        }),
        Promise.all(
          companies.slice(0, query.companyLimit ?? 3).map((company) =>
            this.companyIntelligenceService.getCompanyBrief(company, {
              jobLimit: 3,
              contentLimit: 2,
              changeLimit: 5,
              deadlineLimit: 3,
              deadlineWindowDays: query.deadlineWindowDays,
            }),
          ),
        ),
      ]);
    const jobs = (allJobsEntry?.jobs ?? []).filter((job) =>
      this.watchlistPreviewMatcherService.matchesJob(job, criteria),
    );
    const jobIndex = new Map((allJobsEntry?.jobs ?? []).map((job) => [job.id, job]));
    const contentScope = this.resolveContentScope(companies);
    const contentPosts = await this.resolveContentPosts(contentScope.codes);
    const matchedContent = contentPosts
      .filter((post) =>
        this.watchlistPreviewMatcherService.matchesPost(post, criteria),
      )
      .sort(
        (left, right) =>
          right.publishDate.getTime() - left.publishDate.getTime(),
      )
      .slice(0, query.contentLimit ?? 6);
    const matchedChanges = changeSignals.signals
      .filter((signal) =>
        this.watchlistPreviewMatcherService.matchesChangeSignal(
          signal,
          jobIndex,
          criteria,
        ),
      )
      .slice(0, query.signalLimit ?? 6);
    const matchedDeadlines = deadlineSignals.signals
      .filter((signal) =>
        this.watchlistPreviewMatcherService.matchesDeadlineSignal(
          signal,
          jobIndex,
          criteria,
        ),
      )
      .slice(0, query.signalLimit ?? 6);
    const mergedSnapshot = mergeSnapshotMetadata(
      [
        allJobsEntry?.snapshot,
        ...companyBriefs.map((brief) => brief.snapshot),
        contentScope.snapshot,
      ].filter((snapshot): snapshot is SnapshotMetadata => snapshot !== undefined),
    );
    const generatedAt = new Date().toISOString();
    const sourceIds = new Set<string>(mergedSnapshot?.sourceIds ?? []);

    return {
      generatedAt,
      snapshot: mergedSnapshot,
      summary: {
        companiesTracked: companies.length,
        skillsTracked: skills.length,
        matchedOpportunities: jobs.length,
        matchedContent: matchedContent.length,
        changeSignals: matchedChanges.length,
        deadlineSignals: matchedDeadlines.length,
      },
      meta: {
        companies,
        skills,
        keyword,
      },
      sections: {
        companies: companyBriefs.map((brief) => ({
          code: brief.company.code,
          name: brief.company.name,
          openJobs: brief.overview.openJobs,
          newJobs: brief.overview.newJobs,
          closingSoonJobs: brief.overview.closingSoonJobs,
          latestContentItems: brief.overview.latestContentItems,
        })),
        opportunities: jobs
          .slice()
          .sort(
            (left, right) => left.period.end.getTime() - right.period.end.getTime(),
          )
          .slice(0, query.opportunityLimit ?? 10)
          .map((job) => this.toOpportunity(job)),
        content: matchedContent.map((post) => ({
          company: post.company,
          title: post.title,
          link: post.link,
          publishDate: post.publishDate.toISOString(),
        })),
        recentChanges: matchedChanges.map((signal) => ({
          company: signal.company,
          title: signal.title,
          url: signal.url,
          type: 'job_change',
          emphasis: signal.changeType,
        })),
        upcomingDeadlines: matchedDeadlines.map((signal) => ({
          company: signal.company,
          title: signal.title,
          url: signal.url,
          type: 'job_deadline',
          emphasis: signal.severity,
        })),
      },
      sources: this.sourceRegistryService
        .list()
        .filter((source) => sourceIds.has(source.id))
        .sort((left, right) => left.id.localeCompare(right.id)),
    };
  }

  private async resolveContentPosts(codes: string[]): Promise<BlogPost[]> {
    if (codes.length === 0) {
      return [];
    }

    return this.blogPostRepository.getPostsForCompanies(codes);
  }

  private resolveContentScope(companies: string[]) {
    const codes =
      companies.length > 0
        ? companies
            .map((company) => getCompanyContentSource(company as never)?.blogCode)
            .filter((code): code is string => Boolean(code))
        : this.blogSourceCatalog.listCodes();

    const snapshot = mergeSnapshotMetadata(
      codes
        .map((code) => this.toContentSnapshot(code))
        .filter((entry): entry is SnapshotMetadata => entry !== undefined),
    );

    return {
      codes,
      snapshot,
    };
  }

  private toContentSnapshot(code: string): SnapshotMetadata | undefined {
    const mappedCompany = Object.entries(COMPANY_CONTENT_SOURCE_MAP).find(
      ([, mapping]) => mapping?.blogCode === code,
    );
    const sourceId = mappedCompany?.[1]?.sourceId ?? getBlogSourceId(code);

    return buildSnapshotMetadata({
      collectedAt: new Date(),
      ttlSeconds: DEFAULT_REDIS_TTL,
      confidence: BLOG_SOURCE_CONFIDENCE,
      sourceIds: [sourceId],
    });
  }

  private toOpportunity(job: JobPosting) {
    return {
      id: job.id,
      company: job.company,
      title: job.title,
      field: job.field,
      skills: [...(job.requirements.skills ?? [])],
      deadline: job.period.end.toISOString(),
      url: job.url,
    };
  }
}
