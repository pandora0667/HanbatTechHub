import { Injectable } from '@nestjs/common';
import { InstitutionType } from './constants/institution-registry.constant';
import {
  InstitutionCatalogResponseDto,
  InstitutionOverviewResponseDto,
  InstitutionRegistryResponseDto,
} from './dto/institution.response.dto';
import { GetInstitutionCatalogUseCase } from './application/use-cases/get-institution-catalog.use-case';
import { GetInstitutionOverviewUseCase } from './application/use-cases/get-institution-overview.use-case';
import { GetInstitutionsUseCase } from './application/use-cases/get-institutions.use-case';

@Injectable()
export class InstitutionIntelligenceService {
  constructor(
    private readonly getInstitutionsUseCase: GetInstitutionsUseCase,
    private readonly getInstitutionCatalogUseCase: GetInstitutionCatalogUseCase,
    private readonly getInstitutionOverviewUseCase: GetInstitutionOverviewUseCase,
  ) {}

  getInstitutions(): InstitutionRegistryResponseDto {
    return this.getInstitutionsUseCase.execute();
  }

  getInstitutionCatalog(
    institution: InstitutionType,
  ): InstitutionCatalogResponseDto {
    return this.getInstitutionCatalogUseCase.execute(institution);
  }

  async getInstitutionOverview(
    institution: InstitutionType,
  ): Promise<InstitutionOverviewResponseDto> {
    return this.getInstitutionOverviewUseCase.execute(institution);
  }
}
