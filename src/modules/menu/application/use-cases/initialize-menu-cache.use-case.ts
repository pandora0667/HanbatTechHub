import { Injectable } from '@nestjs/common';
import { UpdateMenuCacheUseCase } from './update-menu-cache.use-case';

@Injectable()
export class InitializeMenuCacheUseCase {
  constructor(
    private readonly updateMenuCacheUseCase: UpdateMenuCacheUseCase,
  ) {}

  async execute(): Promise<void> {
    await this.updateMenuCacheUseCase.execute();
  }
}
