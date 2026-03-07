import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  NoticeListResponseDto,
  NoticeDetailResponseDto,
} from './dto/notice.dto';
import {
  NOTICE_UPDATE_CRON,
} from './constants/notice.constant';
import { isBackgroundSyncEnabled } from '../../common/utils/background-sync.util';
import { GetNoticesUseCase } from './application/use-cases/get-notices.use-case';
import { GetNoticeGroupUseCase } from './application/use-cases/get-notice-group.use-case';
import { GetNoticeDetailUseCase } from './application/use-cases/get-notice-detail.use-case';
import { InitializeNoticeCacheUseCase } from './application/use-cases/initialize-notice-cache.use-case';
import { UpdateNoticeCacheUseCase } from './application/use-cases/update-notice-cache.use-case';

@Injectable()
export class NoticeService implements OnModuleInit {
  private readonly logger = new Logger(NoticeService.name);
  private isUpdating = false;

  constructor(
    private readonly getNoticesUseCase: GetNoticesUseCase,
    private readonly getNoticeGroupUseCase: GetNoticeGroupUseCase,
    private readonly getNoticeDetailUseCase: GetNoticeDetailUseCase,
    private readonly initializeNoticeCacheUseCase: InitializeNoticeCacheUseCase,
    private readonly updateNoticeCacheUseCase: UpdateNoticeCacheUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!isBackgroundSyncEnabled()) {
      this.logger.log(
        'ENABLE_BACKGROUND_SYNC=false, startup notice sync is skipped.',
      );
      return;
    }

    await this.initializeNoticeCacheUseCase.execute();
  }

  @Cron(NOTICE_UPDATE_CRON)
  async updateNoticeData() {
    if (!isBackgroundSyncEnabled()) {
      return;
    }

    if (this.isUpdating) {
      this.logger.warn(
        '공지사항 데이터 업데이트가 이미 실행 중입니다. 이번 실행은 건너뜁니다.',
      );
      return;
    }

    this.isUpdating = true;

    try {
      this.logger.log('공지사항 데이터 업데이트 시작...');
      await this.updateNoticeCacheUseCase.execute();

      this.logger.log('공지사항 데이터 업데이트 완료');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`공지사항 데이터 업데이트 실패: ${errorMessage}`);
    } finally {
      this.isUpdating = false;
    }
  }

  async getNotices(page = 1, limit = 10): Promise<NoticeListResponseDto> {
    return this.getNoticesUseCase.execute(page, limit);
  }

  async getNewNotices(): Promise<NoticeListResponseDto> {
    return this.getNoticeGroupUseCase.execute('new');
  }

  async getFeaturedNotices(): Promise<NoticeListResponseDto> {
    return this.getNoticeGroupUseCase.execute('featured');
  }

  async getTodayNotices(): Promise<NoticeListResponseDto> {
    return this.getNoticeGroupUseCase.execute('today');
  }

  async getNoticeDetail(nttId: string): Promise<NoticeDetailResponseDto> {
    return this.getNoticeDetailUseCase.execute(nttId);
  }
}
