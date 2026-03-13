import { Injectable } from '@nestjs/common';
import {
  GetSourceFreshnessSignalsQuery,
  GetSourceFreshnessSignalsUseCase,
} from './application/use-cases/get-source-freshness-signals.use-case';
import {
  GetUpcomingOpportunitySignalsQuery,
  GetUpcomingOpportunitySignalsUseCase,
} from './application/use-cases/get-upcoming-opportunity-signals.use-case';
import { SourceFreshnessSignalsResponseDto } from './dto/source-freshness-signals.response.dto';
import { UpcomingOpportunitySignalsResponseDto } from './dto/upcoming-opportunity-signals.response.dto';

@Injectable()
export class SignalsService {
  constructor(
    private readonly getSourceFreshnessSignalsUseCase: GetSourceFreshnessSignalsUseCase,
    private readonly getUpcomingOpportunitySignalsUseCase: GetUpcomingOpportunitySignalsUseCase,
  ) {}

  async getSourceFreshnessSignals(
    query: GetSourceFreshnessSignalsQuery,
  ): Promise<SourceFreshnessSignalsResponseDto> {
    return this.getSourceFreshnessSignalsUseCase.execute(query);
  }

  async getUpcomingOpportunitySignals(
    query: GetUpcomingOpportunitySignalsQuery,
  ): Promise<UpcomingOpportunitySignalsResponseDto> {
    return this.getUpcomingOpportunitySignalsUseCase.execute(query);
  }
}
