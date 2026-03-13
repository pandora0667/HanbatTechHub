import { Test } from '@nestjs/testing';
import { buildSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import {
  BLOG_POST_REPOSITORY,
  BlogPostRepository,
} from '../../../blog/application/ports/blog-post.repository';
import {
  BLOG_SOURCE_CATALOG,
} from '../../../blog/application/ports/blog-source-catalog';
import { CompanyIntelligenceService } from '../../../company-intelligence/company-intelligence.service';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../../../jobs/application/ports/job-posting-cache.repository';
import { SignalsService } from '../../../signals/signals.service';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { GetWatchlistPreviewUseCase } from './get-watchlist-preview.use-case';
import { WatchlistPreviewMatcherService } from '../../domain/services/watchlist-preview-matcher.service';

describe('GetWatchlistPreviewUseCase', () => {
  const jobPostingCacheRepository = {
    getAllJobs: jest.fn(),
  } as unknown as Pick<JobPostingCacheRepository, 'getAllJobs'>;
  const blogPostRepository = {
    getPostsForCompanies: jest.fn(),
  } as unknown as Pick<BlogPostRepository, 'getPostsForCompanies'>;
  const companyIntelligenceService = {
    getCompanyBrief: jest.fn(),
  };
  const signalsService = {
    getOpportunityChangeSignals: jest.fn(),
    getUpcomingOpportunitySignals: jest.fn(),
  };
  const sourceRegistryService = {
    list: jest.fn(() => [
      { id: 'opportunity.jobs.naver', name: 'NAVER Careers' },
      { id: 'content.blog.naver_d2', name: 'NAVER D2' },
    ]),
  };
  const blogSourceCatalog = {
    listCodes: jest.fn(() => ['NAVER_D2', 'KAKAO_ENTERPRISE']),
  };

  let useCase: GetWatchlistPreviewUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetWatchlistPreviewUseCase,
        WatchlistPreviewMatcherService,
        {
          provide: JOB_POSTING_CACHE_REPOSITORY,
          useValue: jobPostingCacheRepository,
        },
        {
          provide: BLOG_POST_REPOSITORY,
          useValue: blogPostRepository,
        },
        {
          provide: BLOG_SOURCE_CATALOG,
          useValue: blogSourceCatalog,
        },
        {
          provide: CompanyIntelligenceService,
          useValue: companyIntelligenceService,
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

    useCase = moduleRef.get(GetWatchlistPreviewUseCase);
  });

  it('builds a query-based watchlist preview', async () => {
    (jobPostingCacheRepository.getAllJobs as jest.Mock).mockResolvedValue({
      jobs: [
        {
          id: 'naver-backend',
          company: 'NAVER',
          title: 'Backend Engineer',
          department: 'Engineering',
          field: 'Backend',
          requirements: { career: '신입', skills: ['TypeScript'] },
          employmentType: '정규',
          locations: ['분당'],
          period: {
            start: new Date('2026-03-01T00:00:00.000Z'),
            end: new Date('2026-03-18T00:00:00.000Z'),
          },
          url: 'https://example.com/naver-backend',
          source: { originalId: '1', originalUrl: 'https://example.com/naver-backend' },
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          updatedAt: new Date('2026-03-14T00:00:00.000Z'),
        },
      ],
      snapshot: buildSnapshotMetadata({
        collectedAt: '2026-03-14T00:00:00.000Z',
        ttlSeconds: 43200,
        confidence: 0.8,
        sourceIds: ['opportunity.jobs.naver'],
      }),
    });
    (blogPostRepository.getPostsForCompanies as jest.Mock).mockResolvedValue([
      {
        id: 'post-1',
        company: 'NAVER_D2',
        title: 'TypeScript at Scale',
        description: 'Backend engineering story',
        link: 'https://example.com/post-1',
        publishDate: new Date('2026-03-10T00:00:00.000Z'),
        isTranslated: true,
      },
    ]);
    companyIntelligenceService.getCompanyBrief.mockResolvedValue({
      company: {
        code: 'NAVER',
        name: 'NAVER Careers',
      },
      snapshot: buildSnapshotMetadata({
        collectedAt: '2026-03-14T00:00:00.000Z',
        ttlSeconds: 43200,
        confidence: 0.8,
        sourceIds: ['opportunity.jobs.naver'],
      }),
      overview: {
        openJobs: 1,
        newJobs: 1,
        closingSoonJobs: 1,
        latestContentItems: 1,
      },
    });
    signalsService.getOpportunityChangeSignals.mockResolvedValue({
      signals: [
        {
          jobId: 'naver-backend',
          company: 'NAVER',
          title: 'Backend Engineer',
          url: 'https://example.com/naver-backend',
          changeType: 'new',
        },
      ],
    });
    signalsService.getUpcomingOpportunitySignals.mockResolvedValue({
      signals: [
        {
          id: 'naver-backend',
          company: 'NAVER',
          title: 'Backend Engineer',
          url: 'https://example.com/naver-backend',
          severity: 'closing_soon',
        },
      ],
    });

    const result = await useCase.execute({
      companies: ['NAVER'],
      skills: ['TypeScript'],
      companyLimit: 3,
      opportunityLimit: 10,
      contentLimit: 6,
      signalLimit: 6,
      deadlineWindowDays: 7,
    });

    expect(result.summary).toEqual(
      expect.objectContaining({
        companiesTracked: 1,
        skillsTracked: 1,
        matchedOpportunities: 1,
        matchedContent: 1,
        changeSignals: 1,
        deadlineSignals: 1,
      }),
    );
    expect(result.sections.companies).toHaveLength(1);
    expect(result.sections.opportunities).toHaveLength(1);
    expect(result.sections.content).toHaveLength(1);
  });
});
