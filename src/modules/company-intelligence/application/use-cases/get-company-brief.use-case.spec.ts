import { Test } from '@nestjs/testing';
import { BLOG_POST_REPOSITORY } from '../../../blog/application/ports/blog-post.repository';
import { JOB_POSTING_CACHE_REPOSITORY } from '../../../jobs/application/ports/job-posting-cache.repository';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { SignalsService } from '../../../signals/signals.service';
import { GetCompanyBriefUseCase } from './get-company-brief.use-case';
import { CompanyBriefOverviewService } from '../../domain/services/company-brief-overview.service';

describe('GetCompanyBriefUseCase', () => {
  const jobPostingCacheRepository = {
    getCompanyJobs: jest.fn(),
  };
  const blogPostRepository = {
    getCompanyPosts: jest.fn(),
    getCompanyLastUpdate: jest.fn(),
  };
  const signalsService = {
    getOpportunityChangeSignals: jest.fn(),
    getUpcomingOpportunitySignals: jest.fn(),
  };
  const sourceRegistryService = {
    list: jest.fn(),
  };

  let useCase: GetCompanyBriefUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetCompanyBriefUseCase,
        CompanyBriefOverviewService,
        {
          provide: JOB_POSTING_CACHE_REPOSITORY,
          useValue: jobPostingCacheRepository,
        },
        {
          provide: BLOG_POST_REPOSITORY,
          useValue: blogPostRepository,
        },
        {
          provide: SignalsService,
          useValue: signalsService,
        },
        {
          provide: SourceRegistryService,
          useValue: sourceRegistryService,
        },
      ],
    }).compile();

    useCase = moduleRef.get(GetCompanyBriefUseCase);
  });

  it('builds a company brief from internal snapshots only', async () => {
    jobPostingCacheRepository.getCompanyJobs.mockResolvedValue({
      jobs: [
        {
          id: 'job-1',
          company: 'NAVER',
          title: 'Backend Engineer',
          department: 'Search',
          field: 'Backend',
          requirements: { career: '신입', skills: ['Node.js'] },
          employmentType: '정규',
          locations: ['분당'],
          period: {
            start: new Date('2026-03-14T00:00:00.000Z'),
            end: new Date('2026-03-20T00:00:00.000Z'),
          },
          url: 'https://example.com/job-1',
          source: {
            originalId: 'job-1',
            originalUrl: 'https://example.com/job-1',
          },
          createdAt: new Date('2026-03-14T00:00:00.000Z'),
          updatedAt: new Date('2026-03-14T00:00:00.000Z'),
        },
      ],
      snapshot: {
        collectedAt: '2026-03-14T00:00:00.000Z',
        staleAt: '2026-03-14T12:00:00.000Z',
        ttlSeconds: 43200,
        confidence: 0.8,
        sourceIds: ['opportunity.jobs.naver'],
      },
    });
    blogPostRepository.getCompanyPosts.mockResolvedValue([
      {
        id: 'post-1',
        company: 'NAVER_D2',
        title: 'Post',
        description: 'Desc',
        link: 'https://example.com/post-1',
        publishDate: new Date('2026-03-13T00:00:00.000Z'),
        isTranslated: true,
      },
    ]);
    blogPostRepository.getCompanyLastUpdate.mockResolvedValue(
      '2026-03-14T00:10:00.000Z',
    );
    signalsService.getOpportunityChangeSignals.mockResolvedValue({
      generatedAt: '2026-03-14T00:20:00.000Z',
      summary: { total: 2, created: 1, updated: 1, removed: 0 },
      signals: [],
      snapshot: {
        collectedAt: '2026-03-14T00:00:00.000Z',
        staleAt: '2026-03-14T12:00:00.000Z',
        ttlSeconds: 43200,
        confidence: 0.8,
        sourceIds: ['opportunity.jobs.naver'],
      },
    });
    signalsService.getUpcomingOpportunitySignals.mockResolvedValue({
      generatedAt: '2026-03-14T00:20:00.000Z',
      summary: {
        total: 1,
        closingToday: 0,
        closingSoon: 1,
        watch: 0,
        windowDays: 7,
      },
      signals: [],
      snapshot: {
        collectedAt: '2026-03-14T00:00:00.000Z',
        staleAt: '2026-03-14T12:00:00.000Z',
        ttlSeconds: 43200,
        confidence: 0.8,
        sourceIds: ['opportunity.jobs.naver'],
      },
    });
    sourceRegistryService.list.mockReturnValue([
      {
        id: 'opportunity.jobs.naver',
        name: 'NAVER Careers',
        provider: 'NAVER',
        context: 'opportunity',
        collectionMode: 'html',
        tier: 'public_page',
        active: true,
        collectionUrl: 'https://recruit.navercorp.com/rcrt/list.do',
        maxCollectionsPerDay: 3,
        freshnessTtlSeconds: 43200,
        confidence: 0.8,
      },
      {
        id: 'content.blog.naver_d2',
        name: '네이버 D2',
        provider: '네이버 D2',
        context: 'content',
        collectionMode: 'feed',
        tier: 'official_feed',
        active: true,
        collectionUrl: 'https://d2.naver.com/d2.atom',
        maxCollectionsPerDay: 3,
        freshnessTtlSeconds: 86400,
        confidence: 0.9,
      },
    ]);

    const result = await useCase.execute('NAVER', {
      jobLimit: 3,
      contentLimit: 2,
      changeLimit: 5,
      deadlineLimit: 5,
      deadlineWindowDays: 7,
    });

    expect(signalsService.getOpportunityChangeSignals).toHaveBeenCalledWith({
      company: 'NAVER',
      limit: 5,
    });
    expect(signalsService.getUpcomingOpportunitySignals).toHaveBeenCalledWith({
      company: 'NAVER',
      limit: 5,
      days: 7,
    });
    expect(result.company.code).toBe('NAVER');
    expect(result.overview).toEqual({
      openJobs: 1,
      newJobs: 1,
      updatedJobs: 1,
      removedJobs: 0,
      closingSoonJobs: 1,
      latestContentItems: 1,
    });
    expect(result.sections.latestContent.available).toBe(true);
    expect(result.sections.sources).toHaveLength(2);
    expect(result.sections.jobs.items).toHaveLength(1);
  });
});
