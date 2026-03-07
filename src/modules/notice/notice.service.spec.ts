import { Test, TestingModule } from '@nestjs/testing';
import { NoticeService } from './notice.service';
import { RedisService } from '../redis/redis.service';
import { NoticeRepository } from './notice.repository';

describe('NoticeService', () => {
  let service: NoticeService;
  const redisService = {
    get: jest.fn(),
    set: jest.fn(),
  };
  const noticeRepository = {
    getNotices: jest.fn(),
    saveNotices: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoticeService,
        { provide: RedisService, useValue: redisService },
        { provide: NoticeRepository, useValue: noticeRepository },
      ],
    }).compile();

    service = module.get<NoticeService>(NoticeService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns pagination metadata with 0 total pages for empty new notices', async () => {
    redisService.get.mockResolvedValue(null);
    jest.spyOn(service as any, 'fetchNoticeList').mockResolvedValue([]);

    const response = await service.getNewNotices();

    expect(response.meta.totalPages).toBe(0);
    expect(response.items).toEqual([]);
  });
});
