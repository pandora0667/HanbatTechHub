import { Test } from '@nestjs/testing';
import { MenuCalendarService } from '../../../menu/domain/services/menu-calendar.service';
import {
  MENU_CACHE_REPOSITORY,
} from '../../../menu/application/ports/menu-cache.repository';
import {
  NOTICE_CACHE_REPOSITORY,
} from '../../../notice/application/ports/notice-cache.repository';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { GetInstitutionOverviewUseCase } from './get-institution-overview.use-case';
import { GetInstitutionDiscoveryUseCase } from './get-institution-discovery.use-case';

describe('GetInstitutionOverviewUseCase', () => {
  const menuCacheRepository = {
    getWeeklyMenu: jest.fn(),
    getWeeklyMenuLastUpdate: jest.fn(),
  };
  const noticeCacheRepository = {
    getRegularNotices: jest.fn(),
    getNoticeGroup: jest.fn(),
    getLastUpdate: jest.fn(),
  };
  const sourceRegistryService = {
    list: jest.fn(() => [
      { id: 'institution.hanbat.discovery', name: 'Hanbat Discovery' },
      { id: 'institution.hanbat.menu', name: 'Hanbat Menu' },
      { id: 'institution.hanbat.notice', name: 'Hanbat Notice' },
      { id: 'institution.snu.discovery', name: 'SNU Discovery' },
    ]),
  };
  const getInstitutionDiscoveryUseCase = {
    execute: jest.fn((institution: string) =>
      Promise.resolve({
        generatedAt: '2026-03-14T00:00:00.000Z',
        institution: { id: institution },
        snapshot: {
          collectedAt: '2026-03-14T00:00:00.000Z',
          staleAt: '2026-03-15T00:00:00.000Z',
          ttlSeconds: 86400,
          confidence: 0.72,
          sourceIds: [`institution.${institution.toLowerCase()}.discovery`],
        },
        summary: {
          mode: 'live',
          coveredServiceTypes: 4,
          totalRequestedServiceTypes: 10,
          totalDiscoveredLinks: 12,
          pagesVisited: 2,
        },
        sections: [
          {
            serviceType: 'scholarship',
            linkCount: 1,
            links: [
              {
                title: '장학',
                url: 'https://example.com/scholarship',
                pageUrl: 'https://example.com',
                matchedKeywords: ['장학'],
                score: 1,
              },
            ],
          },
        ],
      }),
    ),
  };

  let useCase: GetInstitutionOverviewUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetInstitutionOverviewUseCase,
        MenuCalendarService,
        {
          provide: MENU_CACHE_REPOSITORY,
          useValue: menuCacheRepository,
        },
        {
          provide: NOTICE_CACHE_REPOSITORY,
          useValue: noticeCacheRepository,
        },
        {
          provide: SourceRegistryService,
          useValue: sourceRegistryService,
        },
        {
          provide: GetInstitutionDiscoveryUseCase,
          useValue: getInstitutionDiscoveryUseCase,
        },
      ],
    }).compile();

    useCase = moduleRef.get(GetInstitutionOverviewUseCase);
  });

  it('builds an institution overview from cached menu and notice snapshots', async () => {
    menuCacheRepository.getWeeklyMenu.mockResolvedValue([
      { date: '2026-03-16', lunch: ['A'], dinner: ['B'] },
      { date: '2026-03-17', lunch: ['C'], dinner: [] },
    ]);
    menuCacheRepository.getWeeklyMenuLastUpdate.mockResolvedValue(
      '2026-03-14T00:00:00.000Z',
    );
    noticeCacheRepository.getRegularNotices.mockResolvedValue([
      {
        nttId: '1',
        title: 'General Notice',
        author: 'Admin',
        date: '2026-03-14',
        link: 'https://example.com/1',
      },
    ]);
    noticeCacheRepository.getNoticeGroup.mockImplementation((group: string) => {
      if (group === 'new') {
        return [
          {
            nttId: '2',
            title: 'New Notice',
            author: 'Admin',
            date: '2026-03-14',
            link: 'https://example.com/2',
          },
        ];
      }

      return [];
    });
    noticeCacheRepository.getLastUpdate.mockResolvedValue(
      '2026-03-14T00:00:00.000Z',
    );

    const result = await useCase.execute('HANBAT');

    expect(result.institution.id).toBe('HANBAT');
    expect(result.summary).toEqual(
      expect.objectContaining({
        discoveryMode: 'live',
        discoveredServiceTypes: 4,
        discoveredLinks: 12,
        registeredSources: 3,
        regularNotices: 1,
        newNotices: 1,
        weeklyMenus: 2,
        lunchAvailableDays: 2,
      }),
    );
    expect(result.sections.discoveredServices).toHaveLength(1);
    expect(result.sections.serviceCatalog.length).toBeGreaterThan(0);
    expect(result.sections.sources).toHaveLength(3);
  });

  it('builds a generic overview for discovery-only institutions', async () => {
    const result = await useCase.execute('SNU');

    expect(result.institution.id).toBe('SNU');
    expect(result.summary).toEqual(
      expect.objectContaining({
        discoveryMode: 'live',
        discoveredServiceTypes: 4,
        regularNotices: 0,
        weeklyMenus: 0,
        registeredSources: 1,
      }),
    );
    expect(result.sections.latestNotices).toEqual([]);
    expect(result.sections.weeklyMenus).toEqual([]);
    expect(result.sections.discoveredServices).toHaveLength(1);
  });
});
