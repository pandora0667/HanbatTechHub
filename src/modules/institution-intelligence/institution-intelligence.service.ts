import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { isBackgroundSyncEnabled } from '../../common/utils/background-sync.util';
import { UpdateInstitutionDiscoveryCacheUseCase } from './application/use-cases/update-institution-discovery-cache.use-case';
import { InstitutionType } from './constants/institution-registry.constant';
import {
  InstitutionCatalogResponseDto,
  InstitutionDiscoveryResponseDto,
  InstitutionOverviewResponseDto,
  InstitutionRegistryResponseDto,
} from './dto/institution.response.dto';
import { GetInstitutionCatalogUseCase } from './application/use-cases/get-institution-catalog.use-case';
import { GetInstitutionDiscoveryUseCase } from './application/use-cases/get-institution-discovery.use-case';
import { GetInstitutionOverviewUseCase } from './application/use-cases/get-institution-overview.use-case';
import { GetInstitutionsUseCase } from './application/use-cases/get-institutions.use-case';
import { INSTITUTION_DISCOVERY_UPDATE_CRON } from './constants/institution-discovery.constant';

@Injectable()
export class InstitutionIntelligenceService implements OnModuleInit {
  private readonly logger = new Logger(InstitutionIntelligenceService.name);
  private isUpdatingDiscovery = false;

  constructor(
    private readonly getInstitutionsUseCase: GetInstitutionsUseCase,
    private readonly getInstitutionCatalogUseCase: GetInstitutionCatalogUseCase,
    private readonly getInstitutionDiscoveryUseCase: GetInstitutionDiscoveryUseCase,
    private readonly updateInstitutionDiscoveryCacheUseCase: UpdateInstitutionDiscoveryCacheUseCase,
    private readonly getInstitutionOverviewUseCase: GetInstitutionOverviewUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!isBackgroundSyncEnabled()) {
      this.logger.log(
        'ENABLE_BACKGROUND_SYNC=false, startup institution discovery sync is skipped.',
      );
      return;
    }

    await this.updateInstitutionDiscoveryCacheUseCase.execute();
  }

  getInstitutions(): InstitutionRegistryResponseDto {
    return this.getInstitutionsUseCase.execute();
  }

  getInstitutionCatalog(
    institution: InstitutionType,
  ): InstitutionCatalogResponseDto {
    return this.getInstitutionCatalogUseCase.execute(institution);
  }

  async getInstitutionDiscovery(
    institution: InstitutionType,
  ): Promise<InstitutionDiscoveryResponseDto> {
    return this.getInstitutionDiscoveryUseCase.execute(institution);
  }

  async getInstitutionOverview(
    institution: InstitutionType,
  ): Promise<InstitutionOverviewResponseDto> {
    return this.getInstitutionOverviewUseCase.execute(institution);
  }

  @Cron(INSTITUTION_DISCOVERY_UPDATE_CRON)
  async updateInstitutionDiscovery(): Promise<void> {
    if (!isBackgroundSyncEnabled()) {
      return;
    }

    if (this.isUpdatingDiscovery) {
      this.logger.warn(
        'Institution discovery update is already running. Skipping this cycle.',
      );
      return;
    }

    this.isUpdatingDiscovery = true;

    try {
      await this.updateInstitutionDiscoveryCacheUseCase.execute();
    } finally {
      this.isUpdatingDiscovery = false;
    }
  }
}
