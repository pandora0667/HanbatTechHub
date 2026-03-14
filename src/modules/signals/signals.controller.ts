import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SignalsService } from './signals.service';
import { GetSourceFreshnessQueryDto } from './dto/get-source-freshness-query.dto';
import { SourceFreshnessSignalsResponseDto } from './dto/source-freshness-signals.response.dto';
import { GetUpcomingOpportunitySignalsQueryDto } from './dto/get-upcoming-opportunity-signals-query.dto';
import { UpcomingOpportunitySignalsResponseDto } from './dto/upcoming-opportunity-signals.response.dto';
import { GetOpportunityChangeSignalsQueryDto } from './dto/get-opportunity-change-signals-query.dto';
import { OpportunityChangeSignalsResponseDto } from './dto/opportunity-change-signals.response.dto';
import { GetInstitutionOpportunityChangeSignalsQueryDto } from './dto/get-institution-opportunity-change-signals-query.dto';
import { InstitutionOpportunityChangeSignalsResponseDto } from './dto/institution-opportunity-change-signals.response.dto';

@ApiTags('signals')
@Controller('signals')
export class SignalsController {
  constructor(private readonly signalsService: SignalsService) {}

  @Get('freshness')
  @ApiOperation({
    summary: '내부 스냅샷 기준 소스 freshness/staleness 신호 조회',
  })
  @ApiResponse({
    status: 200,
    description: '소스 freshness 신호 목록',
    type: SourceFreshnessSignalsResponseDto,
  })
  async getSourceFreshnessSignals(
    @Query() query: GetSourceFreshnessQueryDto,
  ): Promise<SourceFreshnessSignalsResponseDto> {
    return this.signalsService.getSourceFreshnessSignals(query);
  }

  @Get('opportunities/upcoming')
  @ApiOperation({
    summary: '채용 마감 임박 신호 조회',
  })
  @ApiResponse({
    status: 200,
    description: '마감 임박 채용 신호 목록',
    type: UpcomingOpportunitySignalsResponseDto,
  })
  async getUpcomingOpportunitySignals(
    @Query() query: GetUpcomingOpportunitySignalsQueryDto,
  ): Promise<UpcomingOpportunitySignalsResponseDto> {
    return this.signalsService.getUpcomingOpportunitySignals(query);
  }

  @Get('opportunities/changes')
  @ApiOperation({
    summary: '채용 신규/수정/삭제 변화 신호 조회',
  })
  @ApiResponse({
    status: 200,
    description: '채용 변화 신호 목록',
    type: OpportunityChangeSignalsResponseDto,
  })
  async getOpportunityChangeSignals(
    @Query() query: GetOpportunityChangeSignalsQueryDto,
  ): Promise<OpportunityChangeSignalsResponseDto> {
    return this.signalsService.getOpportunityChangeSignals(query);
  }

  @Get('institutions/opportunities/changes')
  @ApiOperation({
    summary: 'institution opportunity 신규/수정/삭제 변화 신호 조회',
  })
  @ApiResponse({
    status: 200,
    description: 'institution opportunity 변화 신호 목록',
    type: InstitutionOpportunityChangeSignalsResponseDto,
  })
  async getInstitutionOpportunityChangeSignals(
    @Query() query: GetInstitutionOpportunityChangeSignalsQueryDto,
  ): Promise<InstitutionOpportunityChangeSignalsResponseDto> {
    return this.signalsService.getInstitutionOpportunityChangeSignals(query);
  }
}
