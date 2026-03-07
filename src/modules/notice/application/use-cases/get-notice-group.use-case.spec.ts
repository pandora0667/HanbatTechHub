import { Test, TestingModule } from '@nestjs/testing';
import {
  NOTICE_CACHE_REPOSITORY,
  NoticeCacheRepository,
} from '../ports/notice-cache.repository';
import { NoticeCollectorService } from '../services/notice-collector.service';
import { NoticePaginationService } from '../../domain/services/notice-pagination.service';
import { GetNoticeGroupUseCase } from './get-notice-group.use-case';

describe('GetNoticeGroupUseCase', () => {
  let useCase: GetNoticeGroupUseCase;

  const noticeCacheRepository: jest.Mocked<NoticeCacheRepository> = {
    getRegularNotices: jest.fn(),
    saveRegularNotices: jest.fn(),
    getNoticeGroup: jest.fn(),
    saveNoticeGroup: jest.fn(),
    getNoticeDetail: jest.fn(),
    saveNoticeDetail: jest.fn(),
  };

  const noticeCollectorService = {
    collect: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetNoticeGroupUseCase,
        NoticePaginationService,
        {
          provide: NOTICE_CACHE_REPOSITORY,
          useValue: noticeCacheRepository,
        },
        {
          provide: NoticeCollectorService,
          useValue: noticeCollectorService,
        },
      ],
    }).compile();

    useCase = module.get(GetNoticeGroupUseCase);
    jest.clearAllMocks();
  });

  it('returns pagination metadata with 0 total pages for empty new notices', async () => {
    noticeCacheRepository.getNoticeGroup.mockResolvedValue(null);
    noticeCollectorService.collect.mockResolvedValue({
      regular: [],
      featured: [],
      new: [],
      today: [],
    });

    const response = await useCase.execute('new');

    expect(response.meta.totalPages).toBe(0);
    expect(response.items).toEqual([]);
  });
});
