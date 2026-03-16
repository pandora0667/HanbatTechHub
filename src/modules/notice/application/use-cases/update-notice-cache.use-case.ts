import { Injectable } from '@nestjs/common';
import { NoticeCollectorService } from '../services/notice-collector.service';
import { SourceRuntimeRecorderService } from '../../../source-registry/application/services/source-runtime-recorder.service';

@Injectable()
export class UpdateNoticeCacheUseCase {
  constructor(
    private readonly noticeCollectorService: NoticeCollectorService,
    private readonly sourceRuntimeRecorderService: SourceRuntimeRecorderService,
  ) {}

  async execute(): Promise<void> {
    try {
      await this.noticeCollectorService.collect();
      await this.sourceRuntimeRecorderService.recordSuccess(
        'institution.hanbat.notice',
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await this.sourceRuntimeRecorderService.recordFailure(
        'institution.hanbat.notice',
        errorMessage,
      );
      throw error;
    }
  }
}
