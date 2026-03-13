import { Test, TestingModule } from '@nestjs/testing';
import {
  MENU_CACHE_REPOSITORY,
  MenuCacheRepository,
} from '../ports/menu-cache.repository';
import { MenuLoaderService } from '../services/menu-loader.service';
import { UpdateMenuCacheUseCase } from './update-menu-cache.use-case';

describe('UpdateMenuCacheUseCase', () => {
  let useCase: UpdateMenuCacheUseCase;

  const menuCacheRepository: jest.Mocked<MenuCacheRepository> = {
    getMenuByDate: jest.fn(),
    setMenuByDate: jest.fn(),
    getWeeklyMenu: jest.fn(),
    setWeeklyMenu: jest.fn(),
    getMenuLastUpdate: jest.fn(),
    setMenuLastUpdate: jest.fn(),
    getWeeklyMenuLastUpdate: jest.fn(),
    setWeeklyMenuLastUpdate: jest.fn(),
  };

  const menuLoaderService = {
    loadWeeklyMenu: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateMenuCacheUseCase,
        {
          provide: MENU_CACHE_REPOSITORY,
          useValue: menuCacheRepository,
        },
        {
          provide: MenuLoaderService,
          useValue: menuLoaderService,
        },
      ],
    }).compile();

    useCase = module.get(UpdateMenuCacheUseCase);
    jest.clearAllMocks();
  });

  it('stores weekly cache using the monday key and expands date caches', async () => {
    const weeklyMenu = [
      { date: '2025-03-10', lunch: [], dinner: [] },
      { date: '2025-03-11', lunch: [], dinner: [] },
    ];

    menuLoaderService.loadWeeklyMenu.mockResolvedValue({
      mondayDate: '2025-03-10',
      menus: weeklyMenu,
    });

    await useCase.execute();

    expect(menuCacheRepository.setWeeklyMenu).toHaveBeenCalledWith(
      '2025-03-10',
      weeklyMenu,
    );
    expect(menuCacheRepository.setWeeklyMenuLastUpdate).toHaveBeenCalled();
    expect(menuCacheRepository.setMenuByDate).toHaveBeenNthCalledWith(
      1,
      '2025-03-10',
      weeklyMenu[0],
    );
    expect(menuCacheRepository.setMenuByDate).toHaveBeenNthCalledWith(
      2,
      '2025-03-11',
      weeklyMenu[1],
    );
    expect(menuCacheRepository.setMenuLastUpdate).toHaveBeenNthCalledWith(
      1,
      '2025-03-10',
      expect.any(String),
    );
    expect(menuCacheRepository.setMenuLastUpdate).toHaveBeenNthCalledWith(
      2,
      '2025-03-11',
      expect.any(String),
    );
  });
});
