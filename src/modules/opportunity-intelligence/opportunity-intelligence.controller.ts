import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOpportunitiesQueryDto } from './dto/get-opportunities-query.dto';
import { OpportunityBoardResponseDto } from './dto/opportunity-board.response.dto';
import { OpportunityIntelligenceService } from './opportunity-intelligence.service';

@ApiTags('opportunities')
@Controller('opportunities')
export class OpportunityIntelligenceController {
  constructor(
    private readonly opportunityIntelligenceService: OpportunityIntelligenceService,
  ) {}

  @Get()
  @ApiOperation({
    summary: '전체 opportunity board 조회',
  })
  @ApiResponse({
    status: 200,
    description: '내부 스냅샷 기반 통합 opportunity board',
    type: OpportunityBoardResponseDto,
  })
  async getOpportunityBoard(
    @Query() query: GetOpportunitiesQueryDto,
  ): Promise<OpportunityBoardResponseDto> {
    return this.opportunityIntelligenceService.getOpportunityBoard(query);
  }
}
