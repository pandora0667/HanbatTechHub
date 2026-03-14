import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { globalAgent as httpGlobalAgent } from 'http';
import { globalAgent as httpsGlobalAgent } from 'https';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { RedisService } from '../src/modules/redis/redis.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { InstitutionHomepageSourceGateway } from '../src/modules/institution-intelligence/infrastructure/gateways/institution-homepage-source.gateway';
import { INSTITUTION_DISCOVERY_REPOSITORY } from '../src/modules/institution-intelligence/application/ports/institution-discovery.repository';

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

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let institutionDiscoveryRepository: {
    saveSnapshot: (institution: string, snapshot: unknown) => Promise<void>;
  };
  const previousBackgroundSync = process.env.ENABLE_BACKGROUND_SYNC;

  jest.setTimeout(60000);

  beforeAll(async () => {
    process.env.ENABLE_BACKGROUND_SYNC = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(new InMemoryRedisService())
      .overrideProvider(InstitutionHomepageSourceGateway)
      .useValue({
        fetchPages: jest.fn(async (institution: { officialEntryUrl: string }) => [
          {
            url: institution.officialEntryUrl,
            html: `
              <html><body>
                <a href="/notice">학사공지</a>
                <a href="/scholarship">장학 안내</a>
                <a href="/career">취업지원센터</a>
              </body></html>
            `,
          },
        ]),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('api/v1', {
      exclude: ['/health'],
    });
    await app.init();
    institutionDiscoveryRepository = app.get(INSTITUTION_DISCOVERY_REPOSITORY);
  });

  afterAll(async () => {
    await app.close();
    httpGlobalAgent.destroy();
    httpsGlobalAgent.destroy();

    if (previousBackgroundSync === undefined) {
      delete process.env.ENABLE_BACKGROUND_SYNC;
      return;
    }

    process.env.ENABLE_BACKGROUND_SYNC = previousBackgroundSync;
  });

  it('/api/v1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/v1/sources (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/sources?context=opportunity')
      .expect(200);

    expect(Array.isArray(response.body.sources)).toBe(true);
    expect(response.body.sources.length).toBeGreaterThan(0);
    expect(
      response.body.sources.every(
        (source: { context: string }) => source.context === 'opportunity',
      ),
    ).toBe(true);
  });

  it('/api/v1/sources/health (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/sources/health')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        sources: expect.any(Array),
      }),
    );
    expect(response.body.sources.length).toBeGreaterThan(0);
    expect(response.body.sources[0]).toEqual(
      expect.objectContaining({
        sourceId: expect.any(String),
        state: expect.any(String),
        riskTier: expect.any(String),
        safeCollectionPolicy: expect.any(String),
        maxCollectionsPerDay: expect.any(Number),
        minimumIntervalHours: expect.any(Number),
        freshnessStatus: expect.any(String),
        failureCount: expect.any(Number),
      }),
    );
  });

  it('/api/v1/signals/freshness (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/signals/freshness')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        summary: expect.objectContaining({
          total: expect.any(Number),
        }),
        signals: expect.any(Array),
      }),
    );
  });

  it('/api/v1/signals/opportunities/changes (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/signals/opportunities/changes')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        summary: expect.objectContaining({
          total: expect.any(Number),
          created: expect.any(Number),
          updated: expect.any(Number),
          removed: expect.any(Number),
        }),
        signals: expect.any(Array),
      }),
    );
  });

  it('/api/v1/signals/institutions/opportunities/changes (GET)', async () => {
    const previousCollectedAt = '2026-03-13T12:00:00.000Z';
    const currentCollectedAt = '2026-03-14T12:00:00.000Z';

    await institutionDiscoveryRepository.saveSnapshot('SNU', {
      institutionId: 'SNU',
      mode: 'live',
      collectedAt: previousCollectedAt,
      seedUrls: ['https://www.snu.ac.kr'],
      pagesVisited: ['https://www.snu.ac.kr'],
      sections: [
        {
          serviceType: 'scholarship',
          links: [
            {
              title: '장학금 안내(이전)',
              url: 'https://www.snu.ac.kr/scholarship',
              pageUrl: 'https://www.snu.ac.kr/page',
              matchedKeywords: ['장학'],
              score: 0.8,
              recordType: 'post' as const,
              excerpt: '이전 장학금 공지',
              postedAt: '2026-03-13',
            },
          ],
        },
      ],
    });
    await institutionDiscoveryRepository.saveSnapshot('SNU', {
      institutionId: 'SNU',
      mode: 'live',
      collectedAt: currentCollectedAt,
      seedUrls: ['https://www.snu.ac.kr'],
      pagesVisited: ['https://www.snu.ac.kr'],
      sections: [
        {
          serviceType: 'scholarship',
          links: [
            {
              title: '장학금 안내',
              url: 'https://www.snu.ac.kr/scholarship',
              pageUrl: 'https://www.snu.ac.kr/page',
              matchedKeywords: ['장학'],
              score: 0.8,
              recordType: 'post' as const,
              excerpt: '장학금 공지',
              postedAt: '2026-03-14',
            },
          ],
        },
        {
          serviceType: 'career_program',
          links: [
            {
              title: '취업지원센터',
              url: 'https://www.snu.ac.kr/career',
              pageUrl: 'https://www.snu.ac.kr/page',
              matchedKeywords: ['취업'],
              score: 0.7,
              recordType: 'program' as const,
              excerpt: '취업지원 프로그램',
            },
          ],
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/signals/institutions/opportunities/changes?institutions=SNU')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        baselineCollectedAt: previousCollectedAt,
        summary: expect.objectContaining({
          total: 2,
          created: 1,
          updated: 1,
          removed: 0,
        }),
        signals: expect.arrayContaining([
          expect.objectContaining({
            changeType: 'new',
            institutionId: 'SNU',
            serviceType: 'career_program',
          }),
          expect.objectContaining({
            changeType: 'updated',
            institutionId: 'SNU',
            serviceType: 'scholarship',
          }),
        ]),
      }),
    );
  });

  it('/api/v1/workspace/today (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/workspace/today')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        overview: expect.objectContaining({
          staleSources: expect.any(Number),
          missingSources: expect.any(Number),
          opportunityChanges: expect.any(Number),
          upcomingOpportunities: expect.any(Number),
          latestContentItems: expect.any(Number),
          latestNoticeItems: expect.any(Number),
          institutionOpportunityItems: expect.any(Number),
        }),
        sections: expect.objectContaining({
          freshness: expect.any(Object),
          opportunityChanges: expect.any(Object),
          upcomingOpportunities: expect.any(Object),
          latestContent: expect.any(Object),
          latestNotices: expect.any(Object),
          institutionOpportunities: expect.any(Object),
        }),
      }),
    );
  });

  it('/api/v1/institutions (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/institutions')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        institutions: expect.any(Array),
      }),
    );
    expect(response.body.institutions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'HANBAT',
          name: expect.any(String),
          region: expect.any(String),
          audience: expect.any(String),
          institutionType: expect.any(String),
          siteFamily: expect.any(String),
          rolloutWave: expect.any(Number),
          rolloutStatus: expect.any(String),
          overviewAvailable: true,
          priorityServiceTypes: expect.any(Array),
          implementedServiceTypes: expect.any(Array),
          sourceIds: expect.any(Array),
        }),
      ]),
    );
    expect(response.body.institutions.length).toBeGreaterThan(30);
  });

  it('/api/v1/institutions/HANBAT/catalog (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/institutions/HANBAT/catalog')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        institution: expect.objectContaining({
          id: 'HANBAT',
          overviewAvailable: true,
        }),
        summary: expect.objectContaining({
          totalBlueprints: expect.any(Number),
          implementedBlueprints: expect.any(Number),
          registeredSources: 3,
        }),
        services: expect.any(Array),
        registeredSources: expect.any(Array),
      }),
    );
    expect(response.body.services).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          serviceType: 'academic_notice',
          sourceId: 'institution.hanbat.notice',
        }),
        expect.objectContaining({
          serviceType: 'meal',
          sourceId: 'institution.hanbat.menu',
        }),
      ]),
    );
  });

  it('/api/v1/institutions/SNU/discovery (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/institutions/SNU/discovery')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        institution: expect.objectContaining({
          id: 'SNU',
        }),
        snapshot: expect.objectContaining({
          collectedAt: expect.any(String),
          sourceIds: ['institution.snu.discovery'],
        }),
        summary: expect.objectContaining({
          coveredServiceTypes: expect.any(Number),
          totalRequestedServiceTypes: expect.any(Number),
          totalDiscoveredLinks: expect.any(Number),
          pagesVisited: expect.any(Number),
        }),
        sections: expect.any(Array),
      }),
    );
  });

  it('/api/v1/institutions/SNU/opportunities (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/institutions/SNU/opportunities?serviceType=scholarship')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        institution: expect.objectContaining({
          id: 'SNU',
        }),
        summary: expect.objectContaining({
          totalOpportunities: expect.any(Number),
          serviceTypesCovered: expect.any(Number),
          liveInstitutions: expect.any(Number),
          fallbackInstitutions: expect.any(Number),
        }),
        meta: expect.objectContaining({
          limit: expect.any(Number),
          serviceType: 'scholarship',
          snapshot: expect.objectContaining({
            sourceIds: ['institution.snu.discovery'],
          }),
        }),
        items: expect.any(Array),
        sources: expect.any(Array),
      }),
    );
  });

  it('/api/v1/institutions/opportunities/board (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/institutions/opportunities/board?institutions=HANBAT,SNU')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        summary: expect.objectContaining({
          totalOpportunities: expect.any(Number),
          serviceTypesCovered: expect.any(Number),
          liveInstitutions: expect.any(Number),
          fallbackInstitutions: expect.any(Number),
        }),
        meta: expect.objectContaining({
          totalCount: expect.any(Number),
          snapshot: expect.any(Object),
        }),
        items: expect.any(Array),
        sources: expect.any(Array),
      }),
    );
  });

  it('/api/v1/institutions/HANBAT/overview (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/institutions/HANBAT/overview')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        institution: expect.objectContaining({
          id: 'HANBAT',
          name: expect.any(String),
          region: expect.any(String),
          audience: expect.any(String),
          institutionType: expect.any(String),
          siteFamily: expect.any(String),
          rolloutWave: expect.any(Number),
          rolloutStatus: expect.any(String),
          overviewAvailable: true,
          priorityServiceTypes: expect.any(Array),
          implementedServiceTypes: expect.any(Array),
          sourceIds: expect.any(Array),
        }),
        summary: expect.objectContaining({
          discoveryMode: expect.any(String),
          discoveredServiceTypes: expect.any(Number),
          requestedServiceTypes: expect.any(Number),
          discoveredLinks: expect.any(Number),
          pagesVisited: expect.any(Number),
          registeredSources: expect.any(Number),
          regularNotices: expect.any(Number),
          newNotices: expect.any(Number),
          featuredNotices: expect.any(Number),
          todayNotices: expect.any(Number),
          weeklyMenus: expect.any(Number),
          lunchAvailableDays: expect.any(Number),
          dinnerAvailableDays: expect.any(Number),
        }),
        sections: expect.objectContaining({
          latestNotices: expect.any(Array),
          newNotices: expect.any(Array),
          featuredNotices: expect.any(Array),
          weeklyMenus: expect.any(Array),
          serviceCatalog: expect.any(Array),
          discoveredServices: expect.any(Array),
          sources: expect.any(Array),
        }),
      }),
    );
  });

  it('/api/v1/institutions/SNU/overview (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/institutions/SNU/overview')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        institution: expect.objectContaining({
          id: 'SNU',
          overviewAvailable: true,
        }),
        summary: expect.objectContaining({
          discoveryMode: expect.any(String),
          discoveredServiceTypes: expect.any(Number),
          regularNotices: 0,
          weeklyMenus: 0,
        }),
        sections: expect.objectContaining({
          latestNotices: [],
          weeklyMenus: [],
          serviceCatalog: expect.any(Array),
          discoveredServices: expect.any(Array),
          sources: expect.any(Array),
        }),
      }),
    );
  });

  it('/api/v1/workspace/radar (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/workspace/radar')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        overview: expect.objectContaining({
          staleSources: expect.any(Number),
          missingSources: expect.any(Number),
          newOpportunities: expect.any(Number),
          updatedOpportunities: expect.any(Number),
          removedOpportunities: expect.any(Number),
          closingSoonOpportunities: expect.any(Number),
          newInstitutionOpportunities: expect.any(Number),
          updatedInstitutionOpportunities: expect.any(Number),
          removedInstitutionOpportunities: expect.any(Number),
        }),
        sections: expect.objectContaining({
          staleSources: expect.any(Object),
          missingSources: expect.any(Object),
          newOpportunities: expect.any(Object),
          updatedOpportunities: expect.any(Object),
          removedOpportunities: expect.any(Object),
          upcomingDeadlines: expect.any(Object),
          newInstitutionOpportunities: expect.any(Object),
          updatedInstitutionOpportunities: expect.any(Object),
          removedInstitutionOpportunities: expect.any(Object),
        }),
      }),
    );
  });

  it('/api/v1/companies/NAVER/brief (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/companies/NAVER/brief')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        company: expect.objectContaining({
          code: 'NAVER',
          name: expect.any(String),
          provider: expect.any(String),
        }),
        overview: expect.objectContaining({
          openJobs: expect.any(Number),
          newJobs: expect.any(Number),
          updatedJobs: expect.any(Number),
          removedJobs: expect.any(Number),
          closingSoonJobs: expect.any(Number),
          latestContentItems: expect.any(Number),
        }),
        sections: expect.objectContaining({
          jobs: expect.any(Object),
          latestContent: expect.any(Object),
          recentChanges: expect.any(Object),
          upcomingDeadlines: expect.any(Object),
          sources: expect.any(Array),
        }),
      }),
    );
  });

  it('/api/v1/skills/map (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/skills/map')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        summary: expect.objectContaining({
          totalJobs: expect.any(Number),
          jobsWithSkills: expect.any(Number),
          coverageRatio: expect.any(Number),
          totalSkills: expect.any(Number),
        }),
        skills: expect.any(Array),
      }),
    );
  });

  it('/api/v1/content/feed (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/content/feed?keyword=typescript')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        summary: expect.objectContaining({
          totalItems: expect.any(Number),
          companies: expect.any(Number),
          filtered: true,
        }),
        meta: expect.objectContaining({
          totalCount: expect.any(Number),
          currentPage: expect.any(Number),
          totalPages: expect.any(Number),
          hasNextPage: expect.any(Boolean),
          hasPreviousPage: expect.any(Boolean),
          limit: expect.any(Number),
          keyword: 'typescript',
        }),
        items: expect.any(Array),
        sources: expect.any(Array),
      }),
    );
  });

  it('/api/v1/content/trends (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/content/trends?days=14&limit=5')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        summary: expect.objectContaining({
          totalItems: expect.any(Number),
          companies: expect.any(Number),
          windowDays: 14,
          totalTopics: expect.any(Number),
        }),
        trends: expect.any(Array),
        sources: expect.any(Array),
      }),
    );
  });

  it('/api/v1/workspace/act (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/workspace/act')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        overview: expect.objectContaining({
          totalActions: expect.any(Number),
          urgent: expect.any(Number),
          high: expect.any(Number),
          medium: expect.any(Number),
          low: expect.any(Number),
          applyNow: expect.any(Number),
          readNow: expect.any(Number),
        }),
        sections: expect.objectContaining({
          applyNow: expect.any(Array),
          reviewChanges: expect.any(Array),
          institutionChecks: expect.any(Array),
          institutionOpportunities: expect.any(Array),
          readingQueue: expect.any(Array),
        }),
        actions: expect.any(Array),
      }),
    );
  });

  it('/api/v1/compare/companies (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/compare/companies?companies=NAVER,KAKAO')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        overview: expect.objectContaining({
          companyCount: 2,
          totalOpenJobs: expect.any(Number),
          totalNewJobs: expect.any(Number),
          totalClosingSoonJobs: expect.any(Number),
          broadestSkillCoverageCompany: expect.any(String),
          mostActiveHiringCompany: expect.any(String),
        }),
        companies: expect.any(Array),
      }),
    );
    expect(response.body.companies).toHaveLength(2);
  });

  it('/api/v1/research/companies/NAVER (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/research/companies/NAVER')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        company: expect.objectContaining({
          code: 'NAVER',
          name: expect.any(String),
          provider: expect.any(String),
        }),
        thesis: expect.objectContaining({
          headline: expect.any(String),
          summary: expect.any(String),
        }),
        insights: expect.any(Array),
        actions: expect.any(Array),
        sources: expect.any(Array),
      }),
    );
  });

  it('/api/v1/opportunities (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/opportunities?sort=deadline')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        summary: expect.objectContaining({
          totalOpenOpportunities: expect.any(Number),
          companies: expect.any(Number),
          closingSoon: expect.any(Number),
          newSignals: expect.any(Number),
          updatedSignals: expect.any(Number),
        }),
        meta: expect.objectContaining({
          totalCount: expect.any(Number),
          currentPage: expect.any(Number),
          totalPages: expect.any(Number),
          hasNextPage: expect.any(Boolean),
          hasPreviousPage: expect.any(Boolean),
          limit: expect.any(Number),
          sort: 'deadline',
          deadlineWindowDays: expect.any(Number),
        }),
        items: expect.any(Array),
        sources: expect.any(Array),
      }),
    );
  });

  it('/api/v1/market/overview (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/market/overview')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        summary: expect.objectContaining({
          totalOpenOpportunities: expect.any(Number),
          companiesHiring: expect.any(Number),
          fieldsTracked: expect.any(Number),
          skillsTracked: expect.any(Number),
          newSignals: expect.any(Number),
          updatedSignals: expect.any(Number),
          closingSoonOpportunities: expect.any(Number),
          freshSources: expect.any(Number),
          staleSources: expect.any(Number),
          missingSources: expect.any(Number),
        }),
        sections: expect.objectContaining({
          topCompanies: expect.any(Array),
          topSkills: expect.any(Array),
          topFields: expect.any(Array),
          staleSources: expect.any(Array),
        }),
        sources: expect.any(Array),
      }),
    );
  });

  it('/api/v1/watchlist/preview (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/watchlist/preview?companies=NAVER&skills=TypeScript')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        summary: expect.objectContaining({
          companiesTracked: 1,
          skillsTracked: 1,
          matchedOpportunities: expect.any(Number),
          matchedContent: expect.any(Number),
          changeSignals: expect.any(Number),
          deadlineSignals: expect.any(Number),
        }),
        meta: expect.objectContaining({
          companies: ['NAVER'],
          skills: ['TypeScript'],
        }),
        sections: expect.objectContaining({
          companies: expect.any(Array),
          opportunities: expect.any(Array),
          content: expect.any(Array),
          recentChanges: expect.any(Array),
          upcomingDeadlines: expect.any(Array),
        }),
        sources: expect.any(Array),
      }),
    );
  });

  it('/api/v1/watchlist/preview without criteria (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/watchlist/preview')
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        timestamp: expect.any(String),
        path: '/api/v1/watchlist/preview',
        statusCode: 400,
        error: expect.any(String),
        message: expect.anything(),
      }),
    );
  });
});
