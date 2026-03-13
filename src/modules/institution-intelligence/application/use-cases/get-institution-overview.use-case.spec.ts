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
      { id: 'institution.hanbat.menu', name: 'Hanbat Menu' },
      { id: 'institution.hanbat.notice', name: 'Hanbat Notice' },
    ]),
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
        regularNotices: 1,
        newNotices: 1,
        weeklyMenus: 2,
        lunchAvailableDays: 2,
      }),
    );
    expect(result.sections.sources).toHaveLength(2);
  });
});
