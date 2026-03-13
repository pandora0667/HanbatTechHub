import { Injectable } from '@nestjs/common';
import { InstitutionType } from './constants/institution-registry.constant';
import {
  InstitutionOverviewResponseDto,
  InstitutionRegistryResponseDto,
} from './dto/institution.response.dto';
import { GetInstitutionOverviewUseCase } from './application/use-cases/get-institution-overview.use-case';
import { GetInstitutionsUseCase } from './application/use-cases/get-institutions.use-case';

@Injectable()
export class InstitutionIntelligenceService {
  constructor(
    private readonly getInstitutionsUseCase: GetInstitutionsUseCase,
    private readonly getInstitutionOverviewUseCase: GetInstitutionOverviewUseCase,
  ) {}

  getInstitutions(): InstitutionRegistryResponseDto {
    return this.getInstitutionsUseCase.execute();
  }

  async getInstitutionOverview(
    institution: InstitutionType,
  ): Promise<InstitutionOverviewResponseDto> {
    return this.getInstitutionOverviewUseCase.execute(institution);
  }
}
