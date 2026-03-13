import { Injectable } from '@nestjs/common';
import { GetMarketOverviewUseCase } from './application/use-cases/get-market-overview.use-case';
import { GetMarketOverviewQueryDto } from './dto/get-market-overview-query.dto';
import { MarketOverviewResponseDto } from './dto/market-overview.response.dto';

@Injectable()
export class MarketIntelligenceService {
  constructor(
    private readonly getMarketOverviewUseCase: GetMarketOverviewUseCase,
  ) {}

  async getOverview(
    query: GetMarketOverviewQueryDto,
  ): Promise<MarketOverviewResponseDto> {
    return this.getMarketOverviewUseCase.execute(query);
  }
}
