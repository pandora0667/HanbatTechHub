import { Injectable } from '@nestjs/common';
import { GetWatchlistPreviewUseCase } from './application/use-cases/get-watchlist-preview.use-case';
import { GetWatchlistPreviewQueryDto } from './dto/get-watchlist-preview-query.dto';
import { WatchlistPreviewResponseDto } from './dto/watchlist-preview.response.dto';

@Injectable()
export class WatchlistPreviewService {
  constructor(
    private readonly getWatchlistPreviewUseCase: GetWatchlistPreviewUseCase,
  ) {}

  async getPreview(
    query: GetWatchlistPreviewQueryDto,
  ): Promise<WatchlistPreviewResponseDto> {
    return this.getWatchlistPreviewUseCase.execute(query);
  }
}
