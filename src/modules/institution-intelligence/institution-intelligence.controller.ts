import { Controller, Get, Param, ParseEnumPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  INSTITUTION_ENUM,
  InstitutionType,
} from './constants/institution-registry.constant';
import {
  InstitutionCatalogResponseDto,
  InstitutionDiscoveryResponseDto,
  InstitutionOpportunitiesResponseDto,
  InstitutionOverviewResponseDto,
  InstitutionRegistryResponseDto,
} from './dto/institution.response.dto';
import {
  GetInstitutionOpportunityBoardQueryDto,
  GetInstitutionOpportunitiesQueryDto,
} from './dto/get-institution-opportunities-query.dto';
import { InstitutionIntelligenceService } from './institution-intelligence.service';

@ApiTags('institutions')
@Controller('institutions')
export class InstitutionIntelligenceController {
  constructor(
    private readonly institutionIntelligenceService: InstitutionIntelligenceService,
  ) {}

  @Get()
  @ApiOperation({
    summary: '지원하는 institution registry 조회',
  })
  @ApiResponse({
    status: 200,
    description: '등록된 institution 목록',
    type: InstitutionRegistryResponseDto,
  })
  getInstitutions(): InstitutionRegistryResponseDto {
    return this.institutionIntelligenceService.getInstitutions();
  }

  @Get('opportunities/board')
  @ApiOperation({
    summary: '전국 institution opportunity board 조회',
  })
  @ApiResponse({
    status: 200,
    description: 'institution opportunity board',
    type: InstitutionOpportunitiesResponseDto,
  })
  getInstitutionOpportunityBoard(
    @Query() query: GetInstitutionOpportunityBoardQueryDto,
  ): Promise<InstitutionOpportunitiesResponseDto> {
    return this.institutionIntelligenceService.getInstitutionOpportunityBoard(
      query,
    );
  }

  @Get(':institution/catalog')
  @ApiOperation({
    summary: 'institution source catalog 조회',
  })
  @ApiParam({
    name: 'institution',
    enum: Object.values(INSTITUTION_ENUM),
  })
  @ApiResponse({
    status: 200,
    description: 'institution rollout catalog',
    type: InstitutionCatalogResponseDto,
  })
  getInstitutionCatalog(
    @Param('institution', new ParseEnumPipe(INSTITUTION_ENUM))
    institution: InstitutionType,
  ): InstitutionCatalogResponseDto {
    return this.institutionIntelligenceService.getInstitutionCatalog(institution);
  }

  @Get(':institution/discovery')
  @ApiOperation({
    summary: 'institution public service discovery 조회',
  })
  @ApiParam({
    name: 'institution',
    enum: Object.values(INSTITUTION_ENUM),
  })
  @ApiResponse({
    status: 200,
    description: 'institution discovery snapshot',
    type: InstitutionDiscoveryResponseDto,
  })
  getInstitutionDiscovery(
    @Param('institution', new ParseEnumPipe(INSTITUTION_ENUM))
    institution: InstitutionType,
  ): Promise<InstitutionDiscoveryResponseDto> {
    return this.institutionIntelligenceService.getInstitutionDiscovery(
      institution,
    );
  }

  @Get(':institution/opportunities')
  @ApiOperation({
    summary: 'institution opportunity 목록 조회',
  })
  @ApiParam({
    name: 'institution',
    enum: Object.values(INSTITUTION_ENUM),
  })
  @ApiResponse({
    status: 200,
    description: 'institution opportunity list',
    type: InstitutionOpportunitiesResponseDto,
  })
  getInstitutionOpportunities(
    @Param('institution', new ParseEnumPipe(INSTITUTION_ENUM))
    institution: InstitutionType,
    @Query() query: GetInstitutionOpportunitiesQueryDto,
  ): Promise<InstitutionOpportunitiesResponseDto> {
    return this.institutionIntelligenceService.getInstitutionOpportunities(
      institution,
      query,
    );
  }

  @Get(':institution/overview')
  @ApiOperation({
    summary: 'institution overview 조회',
  })
  @ApiParam({
    name: 'institution',
    enum: Object.values(INSTITUTION_ENUM),
  })
  @ApiResponse({
    status: 200,
    description: 'institution snapshot overview',
    type: InstitutionOverviewResponseDto,
  })
  getInstitutionOverview(
    @Param('institution', new ParseEnumPipe(INSTITUTION_ENUM))
    institution: InstitutionType,
  ): Promise<InstitutionOverviewResponseDto> {
    return this.institutionIntelligenceService.getInstitutionOverview(institution);
  }
}
