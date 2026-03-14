import { Controller, Get, Param, ParseEnumPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  INSTITUTION_ENUM,
  InstitutionType,
} from './constants/institution-registry.constant';
import {
  InstitutionCatalogResponseDto,
  InstitutionOverviewResponseDto,
  InstitutionRegistryResponseDto,
} from './dto/institution.response.dto';
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
