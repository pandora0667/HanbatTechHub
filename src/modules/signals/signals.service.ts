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
import {
  GetOpportunityChangeSignalsQuery,
  GetOpportunityChangeSignalsUseCase,
} from './application/use-cases/get-opportunity-change-signals.use-case';
import { OpportunityChangeSignalsResponseDto } from './dto/opportunity-change-signals.response.dto';
import {
  GetInstitutionOpportunityChangeSignalsQuery,
  GetInstitutionOpportunityChangeSignalsUseCase,
} from './application/use-cases/get-institution-opportunity-change-signals.use-case';
import { InstitutionOpportunityChangeSignalsResponseDto } from './dto/institution-opportunity-change-signals.response.dto';

@Injectable()
export class SignalsService {
  constructor(
    private readonly getSourceFreshnessSignalsUseCase: GetSourceFreshnessSignalsUseCase,
    private readonly getUpcomingOpportunitySignalsUseCase: GetUpcomingOpportunitySignalsUseCase,
    private readonly getOpportunityChangeSignalsUseCase: GetOpportunityChangeSignalsUseCase,
    private readonly getInstitutionOpportunityChangeSignalsUseCase: GetInstitutionOpportunityChangeSignalsUseCase,
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

  async getOpportunityChangeSignals(
    query: GetOpportunityChangeSignalsQuery,
  ): Promise<OpportunityChangeSignalsResponseDto> {
    return this.getOpportunityChangeSignalsUseCase.execute(query);
  }

  async getInstitutionOpportunityChangeSignals(
    query: GetInstitutionOpportunityChangeSignalsQuery,
  ): Promise<InstitutionOpportunityChangeSignalsResponseDto> {
    return this.getInstitutionOpportunityChangeSignalsUseCase.execute(query);
  }
}
