import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetWatchlistPreviewQueryDto } from './dto/get-watchlist-preview-query.dto';
import { WatchlistPreviewResponseDto } from './dto/watchlist-preview.response.dto';
import { WatchlistPreviewService } from './watchlist-preview.service';

@ApiTags('watchlist')
@Controller('watchlist')
export class WatchlistPreviewController {
  constructor(
    private readonly watchlistPreviewService: WatchlistPreviewService,
  ) {}

  @Get('preview')
  @ApiOperation({
    summary: '저장 없이 query 기반 watchlist preview 조회',
  })
  @ApiResponse({
    status: 200,
    description: '관심 회사/기술/키워드 기준 watchlist preview',
    type: WatchlistPreviewResponseDto,
  })
  async getPreview(
    @Query() query: GetWatchlistPreviewQueryDto,
  ): Promise<WatchlistPreviewResponseDto> {
    return this.watchlistPreviewService.getPreview(query);
  }
}
