import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CompareService } from './compare.service';
import { GetCompanyCompareQueryDto } from './dto/get-company-compare-query.dto';
import { CompanyCompareResponseDto } from './dto/company-compare.response.dto';

@ApiTags('compare')
@Controller('compare')
export class CompareController {
  constructor(private readonly compareService: CompareService) {}

  @Get('companies')
  @ApiOperation({
    summary: '여러 회사를 내부 스냅샷 기준으로 비교 조회',
  })
  @ApiResponse({
    status: 200,
    description: '회사별 채용·변화·기술 지표 비교 결과',
    type: CompanyCompareResponseDto,
  })
  async compareCompanies(
    @Query() query: GetCompanyCompareQueryDto,
  ): Promise<CompanyCompareResponseDto> {
    return this.compareService.compareCompanies(query);
  }
}
