import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from './menu.service';
import { RedisService } from '../redis/redis.service';

describe('MenuService', () => {
  let service: MenuService;
  const redisService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('stores weekly cache using the monday key', async () => {
    const weeklyMenu = [
      { date: '2025-03-10', lunch: [], dinner: [] },
      { date: '2025-03-11', lunch: [], dinner: [] },
    ];

    jest
      .spyOn(service as any, 'fetchWeeklyMenu')
      .mockResolvedValue(weeklyMenu);
    jest
      .spyOn(service as any, 'getMondayDate')
      .mockReturnValue(new Date('2025-03-10T00:00:00.000Z'));

    await service.updateMenuData();

    expect(redisService.set).toHaveBeenCalledWith(
      'hbnu:menu:weekly:2025-03-10',
      weeklyMenu,
      expect.any(Number),
    );
  });
});
