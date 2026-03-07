import { Injectable } from '@nestjs/common';
import { NoticeCollectorService } from '../services/notice-collector.service';

@Injectable()
export class UpdateNoticeCacheUseCase {
  constructor(private readonly noticeCollectorService: NoticeCollectorService) {}

  async execute(): Promise<void> {
    await this.noticeCollectorService.collect();
  }
}
