import { Injectable } from '@nestjs/common';
import { GetOpportunityBoardUseCase } from './application/use-cases/get-opportunity-board.use-case';
import { GetOpportunitiesQueryDto } from './dto/get-opportunities-query.dto';
import { OpportunityBoardResponseDto } from './dto/opportunity-board.response.dto';

@Injectable()
export class OpportunityIntelligenceService {
  constructor(
    private readonly getOpportunityBoardUseCase: GetOpportunityBoardUseCase,
  ) {}

  async getOpportunityBoard(
    query: GetOpportunitiesQueryDto,
  ): Promise<OpportunityBoardResponseDto> {
    return this.getOpportunityBoardUseCase.execute(query);
  }
}
