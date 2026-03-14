import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { globalAgent as httpGlobalAgent } from 'http';
import { globalAgent as httpsGlobalAgent } from 'https';
import { MenuService } from '../src/modules/menu/menu.service';
import { MenuCalendarService } from '../src/modules/menu/domain/services/menu-calendar.service';
import { MenuResponseFactoryService } from '../src/modules/menu/domain/services/menu-response-factory.service';
import { MenuLoaderService } from '../src/modules/menu/application/services/menu-loader.service';
import { GetMenuByDateUseCase } from '../src/modules/menu/application/use-cases/get-menu-by-date.use-case';
import { GetWeeklyMenuUseCase } from '../src/modules/menu/application/use-cases/get-weekly-menu.use-case';
import { UpdateMenuCacheUseCase } from '../src/modules/menu/application/use-cases/update-menu-cache.use-case';
import { InitializeMenuCacheUseCase } from '../src/modules/menu/application/use-cases/initialize-menu-cache.use-case';
import { RedisMenuRepository } from '../src/modules/menu/infrastructure/persistence/redis-menu.repository';
import { HanbatMenuSourceGateway } from '../src/modules/menu/infrastructure/gateways/hanbat-menu-source.gateway';
import { MENU_CACHE_REPOSITORY } from '../src/modules/menu/application/ports/menu-cache.repository';
import { MENU_SOURCE_GATEWAY } from '../src/modules/menu/application/ports/menu-source.gateway';
import { MenuResponseMapper } from '../src/modules/menu/presentation/mappers/menu-response.mapper';
import { NoticeService } from '../src/modules/notice/notice.service';
import { NoticeGroupingService } from '../src/modules/notice/domain/services/notice-grouping.service';
import { NoticePaginationService } from '../src/modules/notice/domain/services/notice-pagination.service';
import { NoticeCollectorService } from '../src/modules/notice/application/services/notice-collector.service';
import { GetNoticesUseCase } from '../src/modules/notice/application/use-cases/get-notices.use-case';
import { GetNoticeGroupUseCase } from '../src/modules/notice/application/use-cases/get-notice-group.use-case';
import { GetNoticeDetailUseCase } from '../src/modules/notice/application/use-cases/get-notice-detail.use-case';
import { UpdateNoticeCacheUseCase } from '../src/modules/notice/application/use-cases/update-notice-cache.use-case';
import { InitializeNoticeCacheUseCase } from '../src/modules/notice/application/use-cases/initialize-notice-cache.use-case';
import { RedisNoticeCacheRepository } from '../src/modules/notice/infrastructure/persistence/redis-notice-cache.repository';
import { HanbatNoticeSourceGateway } from '../src/modules/notice/infrastructure/gateways/hanbat-notice-source.gateway';
import { NoticeHtmlParserService } from '../src/modules/notice/infrastructure/services/notice-html-parser.service';
import { NOTICE_CACHE_REPOSITORY } from '../src/modules/notice/application/ports/notice-cache.repository';
import { NOTICE_SOURCE_GATEWAY } from '../src/modules/notice/application/ports/notice-source.gateway';
import { NoticeResponseMapper } from '../src/modules/notice/presentation/mappers/notice-response.mapper';
import { BlogService } from '../src/modules/blog/blog.service';
import { BlogPostQueryService } from '../src/modules/blog/domain/services/blog-post-query.service';
import { BlogFeedCollectorService } from '../src/modules/blog/application/services/blog-feed-collector.service';
import { BlogPostTranslationService } from '../src/modules/blog/application/services/blog-post-translation.service';
import { GetAllBlogPostsUseCase } from '../src/modules/blog/application/use-cases/get-all-blog-posts.use-case';
import { GetBlogCompaniesUseCase } from '../src/modules/blog/application/use-cases/get-blog-companies.use-case';
import { GetCompanyBlogPostsUseCase } from '../src/modules/blog/application/use-cases/get-company-blog-posts.use-case';
import { InitializeBlogFeedsUseCase } from '../src/modules/blog/application/use-cases/initialize-blog-feeds.use-case';
import { UpdateBlogFeedsUseCase } from '../src/modules/blog/application/use-cases/update-blog-feeds.use-case';
import { RedisBlogPostRepository } from '../src/modules/blog/infrastructure/persistence/redis-blog-post.repository';
import { BlogSourceCatalogService } from '../src/modules/blog/infrastructure/services/blog-source-catalog.service';
import { RssBlogFeedReaderService } from '../src/modules/blog/infrastructure/services/rss-blog-feed-reader.service';
import { BLOG_POST_REPOSITORY } from '../src/modules/blog/application/ports/blog-post.repository';
import { BLOG_SOURCE_CATALOG } from '../src/modules/blog/application/ports/blog-source-catalog';
import { BlogResponseMapper } from '../src/modules/blog/presentation/mappers/blog-response.mapper';
import { TranslationService } from '../src/modules/translation/services/translation.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { HttpClientUtil } from '../src/modules/jobs/utils/http-client.util';
import { JobPostingSearchService } from '../src/modules/jobs/domain/services/job-posting-search.service';
import { JobPostingSnapshotReaderService } from '../src/modules/jobs/application/services/job-posting-snapshot-reader.service';
import { NaverCrawler } from '../src/modules/jobs/crawlers/naver.crawler';
import { KakaoCrawler } from '../src/modules/jobs/crawlers/kakao.crawler';
import { LineCrawler } from '../src/modules/jobs/crawlers/line.crawler';
import { CoupangCrawler } from '../src/modules/jobs/crawlers/coupang.crawler';
import { JobPosting } from '../src/modules/jobs/interfaces/job-posting.interface';
import { SignalsService } from '../src/modules/signals/signals.service';
import { SignalsController } from '../src/modules/signals/signals.controller';
import { SourceFreshnessEvaluatorService } from '../src/modules/signals/domain/services/source-freshness-evaluator.service';
import { OpportunitySignalBuilderService } from '../src/modules/signals/domain/services/opportunity-signal-builder.service';
import { SourceLastUpdateResolverService } from '../src/modules/signals/application/services/source-last-update-resolver.service';
import { GetSourceFreshnessSignalsUseCase } from '../src/modules/signals/application/use-cases/get-source-freshness-signals.use-case';
import { GetUpcomingOpportunitySignalsUseCase } from '../src/modules/signals/application/use-cases/get-upcoming-opportunity-signals.use-case';
import { GetOpportunityChangeSignalsUseCase } from '../src/modules/signals/application/use-cases/get-opportunity-change-signals.use-case';
import { SourceRegistryService } from '../src/modules/source-registry/source-registry.service';
import { RedisJobPostingCacheRepository } from '../src/modules/jobs/infrastructure/persistence/redis-job-posting-cache.repository';
import { JOB_POSTING_CACHE_REPOSITORY } from '../src/modules/jobs/application/ports/job-posting-cache.repository';
import { WorkspaceService } from '../src/modules/workspace/workspace.service';
import { GetActWorkspaceUseCase } from '../src/modules/workspace/application/use-cases/get-act-workspace.use-case';
import { GetRadarWorkspaceUseCase } from '../src/modules/workspace/application/use-cases/get-radar-workspace.use-case';
import { GetTodayWorkspaceUseCase } from '../src/modules/workspace/application/use-cases/get-today-workspace.use-case';
import { ActWorkspaceOverviewService } from '../src/modules/workspace/domain/services/act-workspace-overview.service';
import { RadarWorkspaceOverviewService } from '../src/modules/workspace/domain/services/radar-workspace-overview.service';
import { TodayWorkspaceOverviewService } from '../src/modules/workspace/domain/services/today-workspace-overview.service';
import { WorkspaceActionBuilderService } from '../src/modules/workspace/domain/services/workspace-action-builder.service';
import { WorkspaceSectionBuilderService } from '../src/modules/workspace/application/services/workspace-section-builder.service';
import { CompanyIntelligenceService } from '../src/modules/company-intelligence/company-intelligence.service';
import { GetCompanyBriefUseCase } from '../src/modules/company-intelligence/application/use-cases/get-company-brief.use-case';
import { CompanyBriefOverviewService } from '../src/modules/company-intelligence/domain/services/company-brief-overview.service';
import { buildSnapshotMetadata } from '../src/common/utils/snapshot.util';
import { JOBS_FRESHNESS_TTL } from '../src/modules/jobs/constants/redis.constant';
import { getJobSourceDescriptor } from '../src/modules/jobs/constants/job-source.constant';
import { SkillIntelligenceService } from '../src/modules/skill-intelligence/skill-intelligence.service';
import { GetSkillMapUseCase } from '../src/modules/skill-intelligence/application/use-cases/get-skill-map.use-case';
import { SkillMapBuilderService } from '../src/modules/skill-intelligence/domain/services/skill-map-builder.service';
import { SkillNameNormalizerService } from '../src/modules/skill-intelligence/domain/services/skill-name-normalizer.service';
import { CompareService } from '../src/modules/compare/compare.service';
import { GetCompanyCompareUseCase } from '../src/modules/compare/application/use-cases/get-company-compare.use-case';
import { CompanyCompareOverviewService } from '../src/modules/compare/domain/services/company-compare-overview.service';
import { ResearchService } from '../src/modules/research/research.service';
import { GetCompanyResearchUseCase } from '../src/modules/research/application/use-cases/get-company-research.use-case';
import { CompanyResearchBuilderService } from '../src/modules/research/domain/services/company-research-builder.service';
import { OpportunityIntelligenceService } from '../src/modules/opportunity-intelligence/opportunity-intelligence.service';
import { GetOpportunityBoardUseCase } from '../src/modules/opportunity-intelligence/application/use-cases/get-opportunity-board.use-case';
import { MarketIntelligenceService } from '../src/modules/market-intelligence/market-intelligence.service';
import { GetMarketOverviewUseCase } from '../src/modules/market-intelligence/application/use-cases/get-market-overview.use-case';
import { MarketOverviewBuilderService } from '../src/modules/market-intelligence/domain/services/market-overview-builder.service';
import { WatchlistPreviewService } from '../src/modules/watchlist-preview/watchlist-preview.service';
import { GetWatchlistPreviewUseCase } from '../src/modules/watchlist-preview/application/use-cases/get-watchlist-preview.use-case';
import { WatchlistPreviewMatcherService } from '../src/modules/watchlist-preview/domain/services/watchlist-preview-matcher.service';
import { SourceRuntimeStatusService } from '../src/modules/source-registry/application/services/source-runtime-status.service';
import { GetSourceHealthUseCase } from '../src/modules/source-registry/application/use-cases/get-source-health.use-case';
import { InstitutionIntelligenceService } from '../src/modules/institution-intelligence/institution-intelligence.service';
import { GetInstitutionsUseCase } from '../src/modules/institution-intelligence/application/use-cases/get-institutions.use-case';
import { GetInstitutionCatalogUseCase } from '../src/modules/institution-intelligence/application/use-cases/get-institution-catalog.use-case';
import { GetInstitutionDiscoveryUseCase } from '../src/modules/institution-intelligence/application/use-cases/get-institution-discovery.use-case';
import { GetInstitutionOpportunityBoardUseCase } from '../src/modules/institution-intelligence/application/use-cases/get-institution-opportunity-board.use-case';
import { GetInstitutionOpportunitiesUseCase } from '../src/modules/institution-intelligence/application/use-cases/get-institution-opportunities.use-case';
import { GetInstitutionOverviewUseCase } from '../src/modules/institution-intelligence/application/use-cases/get-institution-overview.use-case';
import {
  INSTITUTION_DISCOVERY_REPOSITORY,
} from '../src/modules/institution-intelligence/application/ports/institution-discovery.repository';
import { InstitutionHomepageSourceGateway } from '../src/modules/institution-intelligence/infrastructure/gateways/institution-homepage-source.gateway';
import { InstitutionLinkDiscoveryService } from '../src/modules/institution-intelligence/domain/services/institution-link-discovery.service';
import { InstitutionOpportunityBuilderService } from '../src/modules/institution-intelligence/domain/services/institution-opportunity-builder.service';
import { RedisInstitutionDiscoveryRepository } from '../src/modules/institution-intelligence/infrastructure/persistence/redis-institution-discovery.repository';
import { UpdateInstitutionDiscoveryCacheUseCase } from '../src/modules/institution-intelligence/application/use-cases/update-institution-discovery-cache.use-case';
import { ContentIntelligenceService } from '../src/modules/content-intelligence/content-intelligence.service';
import { GetContentFeedUseCase } from '../src/modules/content-intelligence/application/use-cases/get-content-feed.use-case';
import { GetContentTrendsUseCase } from '../src/modules/content-intelligence/application/use-cases/get-content-trends.use-case';
import { ContentTopicExtractorService } from '../src/modules/content-intelligence/domain/services/content-topic-extractor.service';

const RUN_LIVE_SMOKE = process.env.RUN_LIVE_SMOKE === '1';
const RUN_LIVE_SMOKE_COUPANG = process.env.RUN_LIVE_SMOKE_COUPANG === '1';
const describeLive = RUN_LIVE_SMOKE ? describe : describe.skip;

jest.setTimeout(180000);

class InMemoryRedisService {
  private readonly store = new Map<string, string>();

  async get<T>(key: string): Promise<T | null> {
    const value = this.store.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.store.set(key, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async flushAll(): Promise<void> {
    this.store.clear();
  }

  async flushByPattern(pattern: string): Promise<void> {
    const prefix = pattern.replace(/\*$/, '');
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  async initializeServiceCache(serviceName: string): Promise<void> {
    const pattern = serviceName.endsWith(':*')
      ? serviceName
      : `${serviceName}:*`;
    await this.flushByPattern(pattern);
  }
}

const translationServiceStub = {
  translate: jest.fn(async (text: string) => text),
};

function expectJobShape(job: JobPosting): void {
  expect(job.id).toBeTruthy();
  expect(job.title).toBeTruthy();
  expect(job.company).toBeTruthy();
  expect(job.url).toMatch(/^https?:\/\//);
  expect(job.period.start).toBeInstanceOf(Date);
  expect(job.period.end).toBeInstanceOf(Date);
}

describeLive('Live Integration Smoke', () => {
  let moduleRef: TestingModule;
  let menuService: MenuService;
  let noticeService: NoticeService;
  let blogService: BlogService;
  let signalsService: SignalsService;
  let workspaceService: WorkspaceService;
  let companyIntelligenceService: CompanyIntelligenceService;
  let skillIntelligenceService: SkillIntelligenceService;
  let compareService: CompareService;
  let researchService: ResearchService;
  let opportunityIntelligenceService: OpportunityIntelligenceService;
  let marketIntelligenceService: MarketIntelligenceService;
  let watchlistPreviewService: WatchlistPreviewService;
  let institutionIntelligenceService: InstitutionIntelligenceService;
  let contentIntelligenceService: ContentIntelligenceService;
  let getSourceHealthUseCase: GetSourceHealthUseCase;
  let redisService: InMemoryRedisService;
  let jobPostingCacheRepository: RedisJobPostingCacheRepository;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        MenuService,
        MenuCalendarService,
        MenuResponseFactoryService,
        MenuLoaderService,
        GetMenuByDateUseCase,
        GetWeeklyMenuUseCase,
        UpdateMenuCacheUseCase,
        InitializeMenuCacheUseCase,
        MenuResponseMapper,
        RedisMenuRepository,
        HanbatMenuSourceGateway,
        {
          provide: MENU_CACHE_REPOSITORY,
          useExisting: RedisMenuRepository,
        },
        {
          provide: MENU_SOURCE_GATEWAY,
          useExisting: HanbatMenuSourceGateway,
        },
        NoticeService,
        NoticeGroupingService,
        NoticePaginationService,
        NoticeCollectorService,
        GetNoticesUseCase,
        GetNoticeGroupUseCase,
        GetNoticeDetailUseCase,
        UpdateNoticeCacheUseCase,
        InitializeNoticeCacheUseCase,
        RedisNoticeCacheRepository,
        HanbatNoticeSourceGateway,
        NoticeHtmlParserService,
        NoticeResponseMapper,
        {
          provide: NOTICE_CACHE_REPOSITORY,
          useExisting: RedisNoticeCacheRepository,
        },
        {
          provide: NOTICE_SOURCE_GATEWAY,
          useExisting: HanbatNoticeSourceGateway,
        },
        BlogService,
        BlogPostQueryService,
        BlogFeedCollectorService,
        BlogPostTranslationService,
        GetAllBlogPostsUseCase,
        GetBlogCompaniesUseCase,
        GetCompanyBlogPostsUseCase,
        InitializeBlogFeedsUseCase,
        UpdateBlogFeedsUseCase,
        RedisBlogPostRepository,
        BlogSourceCatalogService,
        RssBlogFeedReaderService,
        BlogResponseMapper,
        {
          provide: BLOG_POST_REPOSITORY,
          useExisting: RedisBlogPostRepository,
        },
        {
          provide: BLOG_SOURCE_CATALOG,
          useExisting: BlogSourceCatalogService,
        },
        RedisJobPostingCacheRepository,
        JobPostingSearchService,
        JobPostingSnapshotReaderService,
        {
          provide: JOB_POSTING_CACHE_REPOSITORY,
          useExisting: RedisJobPostingCacheRepository,
        },
        SignalsController,
        SignalsService,
        SourceFreshnessEvaluatorService,
        OpportunitySignalBuilderService,
        SourceLastUpdateResolverService,
        GetSourceFreshnessSignalsUseCase,
        GetUpcomingOpportunitySignalsUseCase,
        GetOpportunityChangeSignalsUseCase,
        SourceRegistryService,
        WorkspaceService,
        GetActWorkspaceUseCase,
        GetRadarWorkspaceUseCase,
        GetTodayWorkspaceUseCase,
        WorkspaceSectionBuilderService,
        WorkspaceActionBuilderService,
        ActWorkspaceOverviewService,
        RadarWorkspaceOverviewService,
        TodayWorkspaceOverviewService,
        CompanyIntelligenceService,
        GetCompanyBriefUseCase,
        CompanyBriefOverviewService,
        SkillIntelligenceService,
        GetSkillMapUseCase,
        SkillMapBuilderService,
        SkillNameNormalizerService,
        CompareService,
        GetCompanyCompareUseCase,
        CompanyCompareOverviewService,
        ResearchService,
        GetCompanyResearchUseCase,
        CompanyResearchBuilderService,
        OpportunityIntelligenceService,
        GetOpportunityBoardUseCase,
        MarketIntelligenceService,
        GetMarketOverviewUseCase,
        MarketOverviewBuilderService,
        WatchlistPreviewService,
        GetWatchlistPreviewUseCase,
        WatchlistPreviewMatcherService,
        SourceRuntimeStatusService,
        GetSourceHealthUseCase,
        InstitutionIntelligenceService,
        GetInstitutionsUseCase,
        GetInstitutionCatalogUseCase,
        GetInstitutionDiscoveryUseCase,
        GetInstitutionOpportunitiesUseCase,
        GetInstitutionOpportunityBoardUseCase,
        GetInstitutionOverviewUseCase,
        UpdateInstitutionDiscoveryCacheUseCase,
        InstitutionLinkDiscoveryService,
        InstitutionOpportunityBuilderService,
        InstitutionHomepageSourceGateway,
        RedisInstitutionDiscoveryRepository,
        {
          provide: INSTITUTION_DISCOVERY_REPOSITORY,
          useExisting: RedisInstitutionDiscoveryRepository,
        },
        ContentIntelligenceService,
        GetContentFeedUseCase,
        GetContentTrendsUseCase,
        ContentTopicExtractorService,
        { provide: RedisService, useClass: InMemoryRedisService },
        { provide: TranslationService, useValue: translationServiceStub },
      ],
    }).compile();

    menuService = moduleRef.get(MenuService);
    noticeService = moduleRef.get(NoticeService);
    blogService = moduleRef.get(BlogService);
    signalsService = moduleRef.get(SignalsService);
    workspaceService = moduleRef.get(WorkspaceService);
    companyIntelligenceService = moduleRef.get(CompanyIntelligenceService);
    skillIntelligenceService = moduleRef.get(SkillIntelligenceService);
    compareService = moduleRef.get(CompareService);
    researchService = moduleRef.get(ResearchService);
    opportunityIntelligenceService = moduleRef.get(
      OpportunityIntelligenceService,
    );
    marketIntelligenceService = moduleRef.get(MarketIntelligenceService);
    watchlistPreviewService = moduleRef.get(WatchlistPreviewService);
    institutionIntelligenceService = moduleRef.get(
      InstitutionIntelligenceService,
    );
    contentIntelligenceService = moduleRef.get(ContentIntelligenceService);
    getSourceHealthUseCase = moduleRef.get(GetSourceHealthUseCase);
    jobPostingCacheRepository = moduleRef.get(RedisJobPostingCacheRepository);
    redisService = moduleRef.get(RedisService);
  });

  beforeEach(async () => {
    await redisService.flushAll();
    translationServiceStub.translate.mockClear();
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }

    httpGlobalAgent.destroy();
    httpsGlobalAgent.destroy();
  });

  it('fetches a live weekly menu snapshot from Hanbat', async () => {
    const weeklyMenu = await menuService.getWeeklyMenu();

    expect(weeklyMenu.snapshot).toEqual(
      expect.objectContaining({
        collectedAt: expect.any(String),
        sourceIds: ['institution.hanbat.menu'],
      }),
    );
    expect(weeklyMenu.menus).toHaveLength(7);
    expect(weeklyMenu.menus[0]).toEqual(
      expect.objectContaining({
        date: expect.any(String),
        lunch: expect.any(Array),
        dinner: expect.any(Array),
      }),
    );
  });

  it('fetches live notice data from Hanbat', async () => {
    const response = await noticeService.getNotices(1, 5);

    expect(response.items.length).toBeGreaterThan(0);
    expect(response.meta.totalCount).toBeGreaterThan(0);
    expect(response.meta.snapshot).toEqual(
      expect.objectContaining({
        collectedAt: expect.any(String),
        sourceIds: ['institution.hanbat.notice'],
      }),
    );
    expect(response.items[0]).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        author: expect.any(String),
        date: expect.any(String),
        nttId: expect.any(String),
      }),
    );
  });

  it('fetches live RSS data for the blog API', async () => {
    const response = await blogService.getAllPosts(1, 5);

    expect(response.items.length).toBeGreaterThan(0);
    expect(response.meta.totalCount).toBeGreaterThan(0);
    expect(response.meta.snapshot).toEqual(
      expect.objectContaining({
        collectedAt: expect.any(String),
        sourceIds: expect.arrayContaining([expect.stringMatching(/^content\.blog\./)]),
      }),
    );
    expect(response.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        company: expect.any(String),
        title: expect.any(String),
        link: expect.stringMatching(/^https?:\/\//),
      }),
    );
  });

  it('builds live source health metadata from cached snapshots', async () => {
    await menuService.getWeeklyMenu();
    await noticeService.getNotices(1, 5);
    await blogService.getAllPosts(1, 5);

    const response = await getSourceHealthUseCase.execute();

    expect(response.sources.length).toBeGreaterThan(0);
    expect(response.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceId: 'institution.hanbat.menu',
          state: 'active',
          riskTier: expect.any(String),
          safeCollectionPolicy: expect.any(String),
          lastSuccessAt: expect.any(String),
        }),
        expect.objectContaining({
          sourceId: 'institution.hanbat.notice',
          state: 'active',
          riskTier: expect.any(String),
          safeCollectionPolicy: expect.any(String),
          lastSuccessAt: expect.any(String),
        }),
      ]),
    );
  });

  it('builds a live institution overview from cached institution snapshots', async () => {
    await menuService.getWeeklyMenu();
    await noticeService.getNotices(1, 5);

    const registry = institutionIntelligenceService.getInstitutions();
    const response =
      await institutionIntelligenceService.getInstitutionOverview('HANBAT');

    expect(registry.institutions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'HANBAT',
          overviewAvailable: true,
        }),
        expect.objectContaining({
          id: 'SNU',
        }),
      ]),
    );
    expect(response.institution.id).toBe('HANBAT');
    expect(response.summary.discoveryMode).toMatch(/live|catalog_fallback/);
    expect(response.summary.regularNotices).toBeGreaterThan(0);
    expect(response.summary.weeklyMenus).toBe(7);
    expect(response.sections.latestNotices.length).toBeGreaterThan(0);
    expect(response.sections.weeklyMenus).toHaveLength(7);
    expect(response.sections.discoveredServices.length).toBeGreaterThan(0);
    expect(response.sections.serviceCatalog.length).toBeGreaterThan(0);
    expect(response.sections.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'institution.hanbat.discovery' }),
        expect.objectContaining({ id: 'institution.hanbat.menu' }),
        expect.objectContaining({ id: 'institution.hanbat.notice' }),
      ]),
    );
  });

  it('discovers live public institution surfaces for wave-1 schools', async () => {
    const waveOneInstitutions = [
      'HANBAT',
      'KANGWON',
      'SEOULTECH',
      'KMOU',
      'GINUE',
      'SNU',
      'INU',
      'KNOU',
    ] as const;

    for (const institution of waveOneInstitutions) {
      const response =
        await institutionIntelligenceService.getInstitutionDiscovery(institution);

      expect(response.institution.id).toBe(institution);
      expect(response.snapshot).toEqual(
        expect.objectContaining({
          collectedAt: expect.any(String),
          sourceIds: [`institution.${institution.toLowerCase()}.discovery`],
        }),
      );
      expect(response.summary.totalRequestedServiceTypes).toBeGreaterThan(0);
      expect(response.summary.pagesVisited).toBeGreaterThan(0);
      expect(response.summary.totalDiscoveredLinks).toBeGreaterThan(0);
    }
  });

  it('builds live institution opportunities for wave-1 schools', async () => {
    const waveOneInstitutions = [
      'HANBAT',
      'KANGWON',
      'SEOULTECH',
      'KMOU',
      'GINUE',
      'SNU',
      'INU',
      'KNOU',
    ] as const;

    for (const institution of waveOneInstitutions) {
      const response =
        await institutionIntelligenceService.getInstitutionOpportunities(
          institution,
          {
            page: 1,
            limit: 10,
          },
        );

      expect(response.institution?.id).toBe(institution);
      expect(response.summary.totalOpportunities).toBeGreaterThan(0);
      expect(response.summary.serviceTypesCovered).toBeGreaterThan(0);
      expect(response.items.length).toBeGreaterThan(0);
      expect(response.sources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: `institution.${institution.toLowerCase()}.discovery`,
          }),
        ]),
      );
    }
  });

  it('builds a nationwide institution opportunity board from cached discovery snapshots', async () => {
    const response =
      await institutionIntelligenceService.getInstitutionOpportunityBoard({
        page: 1,
        limit: 50,
      });

    expect(response.summary.totalOpportunities).toBeGreaterThan(0);
    expect(response.summary.serviceTypesCovered).toBeGreaterThan(0);
    expect(response.summary.liveInstitutions).toBeGreaterThan(0);
    expect(response.items.length).toBeGreaterThan(0);
    expect(response.sources.length).toBeGreaterThan(0);
  });

  it('builds institution overview for every registered national university', async () => {
    const registry = institutionIntelligenceService.getInstitutions();

    for (const institution of registry.institutions) {
      const response = await institutionIntelligenceService.getInstitutionOverview(
        institution.id as never,
      );

      expect(response.institution.id).toBe(institution.id);
      expect(response.summary.requestedServiceTypes).toBeGreaterThan(0);
      expect(response.summary.discoveredServiceTypes).toBeGreaterThan(0);
      expect(response.summary.discoveredLinks).toBeGreaterThan(0);
      expect(response.sections.discoveredServices.length).toBeGreaterThan(0);
      expect(response.sections.serviceCatalog.length).toBeGreaterThan(0);
      expect(response.sections.sources.length).toBeGreaterThan(0);
    }
  });

  it('builds live content feed and trends from cached content snapshots', async () => {
    await blogService.getAllPosts(1, 10);

    const feed = await contentIntelligenceService.getFeed({
      page: 1,
      limit: 5,
    });
    const trends = await contentIntelligenceService.getTrends({
      days: 365,
      minMentions: 1,
      limit: 10,
    });

    expect(feed.summary.totalItems).toBeGreaterThan(0);
    expect(feed.items.length).toBeGreaterThan(0);
    expect(feed.meta.snapshot).toEqual(
      expect.objectContaining({
        collectedAt: expect.any(String),
        sourceIds: expect.arrayContaining([
          expect.stringMatching(/^content\.blog\./),
        ]),
      }),
    );
    expect(feed.sources.length).toBeGreaterThan(0);
    expect(trends.summary.totalItems).toBeGreaterThan(0);
    expect(trends.summary.totalTopics).toBeGreaterThan(0);
    expect(trends.trends.length).toBeGreaterThan(0);
    expect(trends.sources.length).toBeGreaterThan(0);
  });

  it('fetches live job data from major crawlers', async () => {
    const httpClient = new HttpClientUtil();
    const configService = {
      get: jest.fn(),
    } as unknown as ConfigService;
    const crawlers = [
      new NaverCrawler(httpClient, configService),
      new KakaoCrawler(httpClient, configService),
      new LineCrawler(httpClient, configService),
    ];

    const results: Array<{ company: string; jobs: JobPosting[] }> = [];

    for (const crawler of crawlers) {
      const jobs = await crawler.fetchJobs();
      expect(Array.isArray(jobs)).toBe(true);
      if (jobs.length > 0) {
        expectJobShape(jobs[0]);
      }
      results.push({ company: crawler.company, jobs });
    }

    expect(results.some(({ jobs }) => jobs.length > 0)).toBe(true);
  });

  it('builds freshness signals from live snapshots', async () => {
    await menuService.getWeeklyMenu();
    await noticeService.getNotices(1, 5);
    await blogService.getAllPosts(1, 5);

    const response = await signalsService.getSourceFreshnessSignals({
      context: 'institution',
    });

    expect(response.summary.total).toBeGreaterThan(0);
    expect(response.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceId: 'institution.hanbat.menu',
        }),
        expect.objectContaining({
          sourceId: 'institution.hanbat.notice',
        }),
      ]),
    );
  });

  it('builds a live today workspace view from cached snapshots', async () => {
    await menuService.getWeeklyMenu();
    await noticeService.getNotices(1, 5);
    await blogService.getAllPosts(1, 5);

    const response = await workspaceService.getTodayWorkspace({
      contentLimit: 3,
      noticeLimit: 3,
      changeLimit: 5,
      deadlineLimit: 5,
      deadlineWindowDays: 7,
    });

    expect(response.overview.latestContentItems).toBeGreaterThan(0);
    expect(response.overview.latestNoticeItems).toBeGreaterThan(0);
    expect(response.overview.institutionOpportunityItems).toBeGreaterThan(0);
    expect(response.sections.latestContent.items.length).toBeGreaterThan(0);
    expect(response.sections.latestNotices.items.length).toBeGreaterThan(0);
    expect(response.sections.institutionOpportunities.items.length).toBeGreaterThan(
      0,
    );
    expect(response.sections.freshness.summary.total).toBeGreaterThan(0);
  });

  it('builds a live radar workspace view from cached snapshots', async () => {
    await menuService.getWeeklyMenu();
    await noticeService.getNotices(1, 5);
    await blogService.getAllPosts(1, 5);

    const response = await workspaceService.getRadarWorkspace({
      sourceLimit: 5,
      changeLimit: 5,
      deadlineLimit: 5,
      deadlineWindowDays: 7,
    });

    expect(response.overview).toEqual(
      expect.objectContaining({
        staleSources: expect.any(Number),
        missingSources: expect.any(Number),
        newOpportunities: expect.any(Number),
        updatedOpportunities: expect.any(Number),
        removedOpportunities: expect.any(Number),
        closingSoonOpportunities: expect.any(Number),
      }),
    );
    expect(response.sections.staleSources.signals).toEqual(expect.any(Array));
    expect(response.sections.missingSources.signals).toEqual(expect.any(Array));
    expect(response.sections.upcomingDeadlines.signals).toEqual(expect.any(Array));
  });

  it('builds a live company brief from cached job and content snapshots', async () => {
    const httpClient = new HttpClientUtil();
    const configService = {
      get: jest.fn(),
    } as unknown as ConfigService;
    const crawler = new NaverCrawler(httpClient, configService);
    const jobs = await crawler.fetchJobs();
    const source = getJobSourceDescriptor('NAVER');
    const snapshot = buildSnapshotMetadata({
      collectedAt: new Date(),
      ttlSeconds: JOBS_FRESHNESS_TTL,
      confidence: source.confidence,
      sourceIds: [source.id],
    });

    await jobPostingCacheRepository.setCompanyJobs('NAVER', {
      jobs,
      snapshot,
    });
    await jobPostingCacheRepository.setAllJobs({
      jobs,
      snapshot,
    });
    await blogService.getCompanyPosts('NAVER_D2', 1, 3);

    const response = await companyIntelligenceService.getCompanyBrief('NAVER', {
      jobLimit: 3,
      contentLimit: 2,
      changeLimit: 5,
      deadlineLimit: 3,
      deadlineWindowDays: 7,
    });

    expect(response.company.code).toBe('NAVER');
    expect(response.sections.jobs.items.length).toBeGreaterThan(0);
    expect(response.sections.latestContent.available).toBe(true);
    expect(response.sections.latestContent.items.length).toBeGreaterThan(0);
    expect(response.sections.sources.length).toBeGreaterThan(0);
  });

  it('builds a live skill map from cached opportunity snapshots', async () => {
    const httpClient = new HttpClientUtil();
    const configService = {
      get: jest.fn(),
    } as unknown as ConfigService;
    const kakaoJobs = await new KakaoCrawler(httpClient, configService).fetchJobs();
    const lineJobs = await new LineCrawler(httpClient, configService).fetchJobs();
    const jobs = [...kakaoJobs, ...lineJobs];

    await jobPostingCacheRepository.setAllJobs({
      jobs,
      snapshot: buildSnapshotMetadata({
        collectedAt: new Date(),
        ttlSeconds: JOBS_FRESHNESS_TTL,
        confidence: 0.8,
        sourceIds: [
          getJobSourceDescriptor('KAKAO').id,
          getJobSourceDescriptor('LINE').id,
        ],
      }),
    });

    const response = await skillIntelligenceService.getSkillMap({
      limit: 10,
      minDemand: 1,
      sampleLimit: 2,
    });

    expect(response.summary.totalJobs).toBeGreaterThan(0);
    expect(response.summary.jobsWithSkills).toBeGreaterThan(0);
    expect(response.skills.length).toBeGreaterThan(0);
    expect(response.skills[0]).toEqual(
      expect.objectContaining({
        skill: expect.any(String),
        demandCount: expect.any(Number),
        companyCount: expect.any(Number),
        companies: expect.any(Array),
        sampleRoles: expect.any(Array),
        }),
    );
  });

  it('builds a live act workspace view from cached snapshots only', async () => {
    const httpClient = new HttpClientUtil();
    const configService = {
      get: jest.fn(),
    } as unknown as ConfigService;
    const jobs = await new KakaoCrawler(httpClient, configService).fetchJobs();

    await jobPostingCacheRepository.setAllJobs({
      jobs,
      snapshot: buildSnapshotMetadata({
        collectedAt: new Date(),
        ttlSeconds: JOBS_FRESHNESS_TTL,
        confidence: getJobSourceDescriptor('KAKAO').confidence,
        sourceIds: [getJobSourceDescriptor('KAKAO').id],
      }),
    });
    await noticeService.getNewNotices();
    await blogService.getAllPosts(1, 5);

    const response = await workspaceService.getActWorkspace({
      limit: 10,
      deadlineLimit: 5,
      newJobLimit: 5,
      updatedJobLimit: 3,
      noticeLimit: 3,
      contentLimit: 3,
      deadlineWindowDays: 7,
    });

    expect(response.overview.totalActions).toBeGreaterThan(0);
    expect(response.sections.applyNow).toEqual(expect.any(Array));
    expect(response.sections.institutionChecks).toEqual(expect.any(Array));
    expect(response.sections.readingQueue).toEqual(expect.any(Array));
    expect(response.actions.length).toBeGreaterThan(0);
  });

  it('builds a live company comparison from cached snapshots only', async () => {
    const httpClient = new HttpClientUtil();
    const configService = {
      get: jest.fn(),
    } as unknown as ConfigService;
    const naverJobs = await new NaverCrawler(httpClient, configService).fetchJobs();
    const kakaoJobs = await new KakaoCrawler(httpClient, configService).fetchJobs();
    const combinedJobs = [...naverJobs, ...kakaoJobs];

    await jobPostingCacheRepository.setCompanyJobs('NAVER', {
      jobs: naverJobs,
      snapshot: buildSnapshotMetadata({
        collectedAt: new Date(),
        ttlSeconds: JOBS_FRESHNESS_TTL,
        confidence: getJobSourceDescriptor('NAVER').confidence,
        sourceIds: [getJobSourceDescriptor('NAVER').id],
      }),
    });
    await jobPostingCacheRepository.setCompanyJobs('KAKAO', {
      jobs: kakaoJobs,
      snapshot: buildSnapshotMetadata({
        collectedAt: new Date(),
        ttlSeconds: JOBS_FRESHNESS_TTL,
        confidence: getJobSourceDescriptor('KAKAO').confidence,
        sourceIds: [getJobSourceDescriptor('KAKAO').id],
      }),
    });
    await jobPostingCacheRepository.setAllJobs({
      jobs: combinedJobs,
      snapshot: buildSnapshotMetadata({
        collectedAt: new Date(),
        ttlSeconds: JOBS_FRESHNESS_TTL,
        confidence: 0.8,
        sourceIds: [
          getJobSourceDescriptor('NAVER').id,
          getJobSourceDescriptor('KAKAO').id,
        ],
      }),
    });
    await blogService.getCompanyPosts('NAVER_D2', 1, 3);
    await blogService.getCompanyPosts('KAKAO_ENTERPRISE', 1, 3);

    const response = await compareService.compareCompanies({
      companies: ['NAVER', 'KAKAO'],
      jobLimit: 3,
      contentLimit: 2,
      changeLimit: 5,
      deadlineLimit: 3,
      deadlineWindowDays: 7,
      skillLimit: 5,
      minSkillDemand: 1,
    });

    expect(response.overview.companyCount).toBe(2);
    expect(response.overview.totalOpenJobs).toBeGreaterThan(0);
    expect(response.companies).toHaveLength(2);
    expect(response.companies[0]).toEqual(
      expect.objectContaining({
        company: expect.objectContaining({
          code: expect.any(String),
          name: expect.any(String),
          provider: expect.any(String),
        }),
        overview: expect.objectContaining({
          openJobs: expect.any(Number),
          skillsTracked: expect.any(Number),
          skillCoverageRatio: expect.any(Number),
        }),
        topSkills: expect.any(Array),
        sources: expect.any(Array),
      }),
    );
  });

  it('builds a live deterministic company research brief from cached snapshots', async () => {
    const httpClient = new HttpClientUtil();
    const configService = {
      get: jest.fn(),
    } as unknown as ConfigService;
    const jobs = await new NaverCrawler(httpClient, configService).fetchJobs();

    await jobPostingCacheRepository.setCompanyJobs('NAVER', {
      jobs,
      snapshot: buildSnapshotMetadata({
        collectedAt: new Date(),
        ttlSeconds: JOBS_FRESHNESS_TTL,
        confidence: getJobSourceDescriptor('NAVER').confidence,
        sourceIds: [getJobSourceDescriptor('NAVER').id],
      }),
    });
    await jobPostingCacheRepository.setAllJobs({
      jobs,
      snapshot: buildSnapshotMetadata({
        collectedAt: new Date(),
        ttlSeconds: JOBS_FRESHNESS_TTL,
        confidence: getJobSourceDescriptor('NAVER').confidence,
        sourceIds: [getJobSourceDescriptor('NAVER').id],
      }),
    });
    await blogService.getCompanyPosts('NAVER_D2', 1, 3);

    const response = await researchService.getCompanyResearch('NAVER', {
      jobLimit: 3,
      contentLimit: 2,
      changeLimit: 5,
      deadlineLimit: 3,
      deadlineWindowDays: 7,
      skillLimit: 5,
      minSkillDemand: 1,
    });

    expect(response.company.code).toBe('NAVER');
    expect(response.thesis).toEqual(
      expect.objectContaining({
        headline: expect.any(String),
        summary: expect.any(String),
      }),
    );
    expect(response.insights.length).toBeGreaterThan(0);
    expect(response.actions).toEqual(expect.any(Array));
    expect(response.sources.length).toBeGreaterThan(0);
  });

  it('builds a live opportunity board from cached snapshots only', async () => {
    const httpClient = new HttpClientUtil();
    const configService = {
      get: jest.fn(),
    } as unknown as ConfigService;
    const naverJobs = await new NaverCrawler(httpClient, configService).fetchJobs();
    const kakaoJobs = await new KakaoCrawler(httpClient, configService).fetchJobs();
    const jobs = [...naverJobs, ...kakaoJobs];

    await jobPostingCacheRepository.setAllJobs({
      jobs,
      snapshot: buildSnapshotMetadata({
        collectedAt: new Date(),
        ttlSeconds: JOBS_FRESHNESS_TTL,
        confidence: 0.8,
        sourceIds: [
          getJobSourceDescriptor('NAVER').id,
          getJobSourceDescriptor('KAKAO').id,
        ],
      }),
    });

    const response = await opportunityIntelligenceService.getOpportunityBoard({
      sort: 'deadline',
      deadlineWindowDays: 7,
      page: 1,
      limit: 10,
    });

    expect(response.summary.totalOpenOpportunities).toBeGreaterThan(0);
    expect(response.summary.companies).toBeGreaterThan(0);
    expect(response.items.length).toBeGreaterThan(0);
    expect(response.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        company: expect.any(String),
        title: expect.any(String),
        signal: expect.objectContaining({
          isNew: expect.any(Boolean),
          isUpdated: expect.any(Boolean),
          closesSoon: expect.any(Boolean),
          daysRemaining: expect.any(Number),
        }),
      }),
    );
  });

  it('builds a live market overview from cached snapshots only', async () => {
    const httpClient = new HttpClientUtil();
    const configService = {
      get: jest.fn(),
    } as unknown as ConfigService;
    const jobs = [
      ...(await new NaverCrawler(httpClient, configService).fetchJobs()),
      ...(await new KakaoCrawler(httpClient, configService).fetchJobs()),
    ];

    await jobPostingCacheRepository.setAllJobs({
      jobs,
      snapshot: buildSnapshotMetadata({
        collectedAt: new Date(),
        ttlSeconds: JOBS_FRESHNESS_TTL,
        confidence: 0.8,
        sourceIds: [
          getJobSourceDescriptor('NAVER').id,
          getJobSourceDescriptor('KAKAO').id,
        ],
      }),
    });

    const response = await marketIntelligenceService.getOverview({
      topCompanyLimit: 5,
      topSkillLimit: 10,
      topFieldLimit: 8,
      staleSourceLimit: 5,
      deadlineWindowDays: 7,
    });

    expect(response.summary.totalOpenOpportunities).toBeGreaterThan(0);
    expect(response.sections.topCompanies).toEqual(expect.any(Array));
    expect(response.sections.topSkills).toEqual(expect.any(Array));
    expect(response.sections.topFields).toEqual(expect.any(Array));
  });

  it('builds a live watchlist preview from cached snapshots only', async () => {
    const httpClient = new HttpClientUtil();
    const configService = {
      get: jest.fn(),
    } as unknown as ConfigService;
    const jobs = await new NaverCrawler(httpClient, configService).fetchJobs();

    await jobPostingCacheRepository.setCompanyJobs('NAVER', {
      jobs,
      snapshot: buildSnapshotMetadata({
        collectedAt: new Date(),
        ttlSeconds: JOBS_FRESHNESS_TTL,
        confidence: getJobSourceDescriptor('NAVER').confidence,
        sourceIds: [getJobSourceDescriptor('NAVER').id],
      }),
    });
    await jobPostingCacheRepository.setAllJobs({
      jobs,
      snapshot: buildSnapshotMetadata({
        collectedAt: new Date(),
        ttlSeconds: JOBS_FRESHNESS_TTL,
        confidence: getJobSourceDescriptor('NAVER').confidence,
        sourceIds: [getJobSourceDescriptor('NAVER').id],
      }),
    });
    await blogService.getCompanyPosts('NAVER_D2', 1, 3);

    const response = await watchlistPreviewService.getPreview({
      companies: ['NAVER'],
      skills: ['TypeScript'],
      companyLimit: 3,
      opportunityLimit: 10,
      contentLimit: 6,
      signalLimit: 6,
      deadlineWindowDays: 7,
    });

    expect(response.summary.companiesTracked).toBe(1);
    expect(response.sections.companies).toEqual(expect.any(Array));
    expect(response.sections.opportunities).toEqual(expect.any(Array));
    expect(response.sections.content).toEqual(expect.any(Array));
  });

  (RUN_LIVE_SMOKE_COUPANG ? it : it.skip)(
    'fetches live job data from the Coupang crawler',
    async () => {
      const httpClient = new HttpClientUtil();
      const configService = {
        get: jest.fn(),
      } as unknown as ConfigService;
      const crawler = new CoupangCrawler(httpClient, configService);
      const jobs = await crawler.fetchJobs();

      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs.length).toBeGreaterThan(0);
      expectJobShape(jobs[0]);
    },
  );
});
