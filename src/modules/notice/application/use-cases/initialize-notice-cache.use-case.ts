import { Injectable } from '@nestjs/common';
import { UpdateNoticeCacheUseCase } from './update-notice-cache.use-case';

@Injectable()
export class InitializeNoticeCacheUseCase {
  constructor(
    private readonly updateNoticeCacheUseCase: UpdateNoticeCacheUseCase,
  ) {}

  async execute(): Promise<void> {
    await this.updateNoticeCacheUseCase.execute();
  }
}
