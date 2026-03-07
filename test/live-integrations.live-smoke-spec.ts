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
import { NoticeService } from '../src/modules/notice/notice.service';
import { NoticeRepository } from '../src/modules/notice/notice.repository';
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
import { TranslationService } from '../src/modules/translation/services/translation.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { HttpClientUtil } from '../src/modules/jobs/utils/http-client.util';
import { NaverCrawler } from '../src/modules/jobs/crawlers/naver.crawler';
import { KakaoCrawler } from '../src/modules/jobs/crawlers/kakao.crawler';
import { LineCrawler } from '../src/modules/jobs/crawlers/line.crawler';
import { CoupangCrawler } from '../src/modules/jobs/crawlers/coupang.crawler';
import { JobPosting } from '../src/modules/jobs/interfaces/job-posting.interface';

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
    const pattern = serviceName.endsWith(':*') ? serviceName : `${serviceName}:*`;
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
  let redisService: InMemoryRedisService;

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
        NoticeRepository,
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
        {
          provide: BLOG_POST_REPOSITORY,
          useExisting: RedisBlogPostRepository,
        },
        {
          provide: BLOG_SOURCE_CATALOG,
          useExisting: BlogSourceCatalogService,
        },
        { provide: RedisService, useClass: InMemoryRedisService },
        { provide: TranslationService, useValue: translationServiceStub },
      ],
    }).compile();

    menuService = moduleRef.get(MenuService);
    noticeService = moduleRef.get(NoticeService);
    blogService = moduleRef.get(BlogService);
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

    expect(weeklyMenu).toHaveLength(7);
    expect(weeklyMenu[0]).toEqual(
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
    expect(response.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        company: expect.any(String),
        title: expect.any(String),
        link: expect.stringMatching(/^https?:\/\//),
      }),
    );
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
