import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetSourceRegistryQueryDto } from './dto/get-source-registry-query.dto';
import {
  SourceRegistryItemDto,
  SourceRegistryResponseDto,
} from './dto/source-registry-response.dto';
import { SourceRegistryService } from './source-registry.service';
import { GetSourceHealthUseCase } from './application/use-cases/get-source-health.use-case';
import { SourceHealthResponseDto } from './dto/source-health.response.dto';

@ApiTags('sources')
@Controller('sources')
export class SourceRegistryController {
  constructor(
    private readonly sourceRegistryService: SourceRegistryService,
    private readonly getSourceHealthUseCase: GetSourceHealthUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: '내부에서 관리하는 외부 수집 소스 레지스트리 조회',
  })
  @ApiResponse({
    status: 200,
    description: '등록된 수집 소스 목록',
    type: SourceRegistryResponseDto,
  })
  getSources(
    @Query() query: GetSourceRegistryQueryDto,
  ): SourceRegistryResponseDto {
    const sources = this.sourceRegistryService.list(query).map((source) =>
      Object.assign(new SourceRegistryItemDto(), source),
    );

    return { sources };
  }

  @Get('health')
  @ApiOperation({
    summary: '운영용 source health/status 조회',
  })
  @ApiResponse({
    status: 200,
    description: 'source별 운영 상태와 마지막 성공 시각',
    type: SourceHealthResponseDto,
  })
  async getSourceHealth(): Promise<SourceHealthResponseDto> {
    return this.getSourceHealthUseCase.execute();
  }
}
