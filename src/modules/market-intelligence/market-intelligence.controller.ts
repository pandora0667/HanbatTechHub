import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetMarketOverviewQueryDto } from './dto/get-market-overview-query.dto';
import { MarketOverviewResponseDto } from './dto/market-overview.response.dto';
import { MarketIntelligenceService } from './market-intelligence.service';

@ApiTags('market')
@Controller('market')
export class MarketIntelligenceController {
  constructor(
    private readonly marketIntelligenceService: MarketIntelligenceService,
  ) {}

  @Get('overview')
  @ApiOperation({
    summary: '전체 시장 스냅샷 요약 조회',
  })
  @ApiResponse({
    status: 200,
    description: '채용 시장, 기술 수요, source freshness를 합친 overview',
    type: MarketOverviewResponseDto,
  })
  async getOverview(
    @Query() query: GetMarketOverviewQueryDto,
  ): Promise<MarketOverviewResponseDto> {
    return this.marketIntelligenceService.getOverview(query);
  }
}
