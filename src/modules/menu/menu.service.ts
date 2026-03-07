import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MenuResponseDto } from './dto/menu.dto';
import {
  MENU_UPDATE_CRON,
} from './constants/menu.constant';
import { isBackgroundSyncEnabled } from '../../common/utils/background-sync.util';
import { GetMenuByDateUseCase } from './application/use-cases/get-menu-by-date.use-case';
import { GetWeeklyMenuUseCase } from './application/use-cases/get-weekly-menu.use-case';
import { InitializeMenuCacheUseCase } from './application/use-cases/initialize-menu-cache.use-case';
import { UpdateMenuCacheUseCase } from './application/use-cases/update-menu-cache.use-case';

@Injectable()
export class MenuService implements OnModuleInit {
  private readonly logger = new Logger(MenuService.name);
  private isUpdating = false;

  constructor(
    private readonly getMenuByDateUseCase: GetMenuByDateUseCase,
    private readonly getWeeklyMenuUseCase: GetWeeklyMenuUseCase,
    private readonly initializeMenuCacheUseCase: InitializeMenuCacheUseCase,
    private readonly updateMenuCacheUseCase: UpdateMenuCacheUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!isBackgroundSyncEnabled()) {
      this.logger.log(
        'ENABLE_BACKGROUND_SYNC=false, startup menu sync is skipped.',
      );
      return;
    }

    await this.initializeMenuCacheUseCase.execute();
  }

  @Cron(MENU_UPDATE_CRON)
  async updateMenuData() {
    if (!isBackgroundSyncEnabled()) {
      return;
    }

    if (this.isUpdating) {
      this.logger.warn('메뉴 데이터 업데이트가 이미 실행 중입니다. 이번 실행은 건너뜁니다.');
      return;
    }

    this.isUpdating = true;

    try {
      this.logger.log('메뉴 데이터 업데이트 시작...');
      await this.updateMenuCacheUseCase.execute();

      this.logger.log('메뉴 데이터 업데이트 완료');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`메뉴 데이터 업데이트 실패: ${errorMessage}`);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * 특정 날짜의 식단 정보를 가져옵니다.
   * @param date YYYY-MM-DD 형식의 날짜 문자열, 지정하지 않으면 오늘 날짜
   */
  async getMenuByDate(date?: string): Promise<MenuResponseDto> {
    return this.getMenuByDateUseCase.execute(date);
  }

  /**
   * 한 주 동안의 식단 정보를 가져옵니다.
   * @param startDate 시작 날짜, 지정하지 않으면 오늘 날짜
   */
  async getWeeklyMenu(startDate?: string): Promise<MenuResponseDto[]> {
    return this.getWeeklyMenuUseCase.execute(startDate);
  }
}
