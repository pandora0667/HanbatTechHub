import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from './menu.service';
import { RedisService } from '../redis/redis.service';
import { MenuCalendarService } from './domain/services/menu-calendar.service';
import { MenuResponseFactoryService } from './domain/services/menu-response-factory.service';
import { MenuLoaderService } from './application/services/menu-loader.service';
import { GetMenuByDateUseCase } from './application/use-cases/get-menu-by-date.use-case';
import { GetWeeklyMenuUseCase } from './application/use-cases/get-weekly-menu.use-case';
import { UpdateMenuCacheUseCase } from './application/use-cases/update-menu-cache.use-case';
import { InitializeMenuCacheUseCase } from './application/use-cases/initialize-menu-cache.use-case';
import { RedisMenuRepository } from './infrastructure/persistence/redis-menu.repository';
import { HanbatMenuSourceGateway } from './infrastructure/gateways/hanbat-menu-source.gateway';
import { MENU_CACHE_REPOSITORY } from './application/ports/menu-cache.repository';
import { MENU_SOURCE_GATEWAY } from './application/ports/menu-source.gateway';

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
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
