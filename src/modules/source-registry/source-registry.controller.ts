import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetSourceRegistryQueryDto } from './dto/get-source-registry-query.dto';
import {
  SourceRegistryItemDto,
  SourceRegistryResponseDto,
} from './dto/source-registry-response.dto';
import { SourceRegistryService } from './source-registry.service';

@ApiTags('sources')
@Controller('sources')
export class SourceRegistryController {
  constructor(private readonly sourceRegistryService: SourceRegistryService) {}

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
}
