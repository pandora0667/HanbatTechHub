import { Module } from '@nestjs/common';
import { MenuModule } from '../menu/menu.module';
import { NoticeModule } from '../notice/notice.module';
import { RedisModule } from '../redis/redis.module';
import { SourceRegistryModule } from '../source-registry/source-registry.module';
import { GetInstitutionCatalogUseCase } from './application/use-cases/get-institution-catalog.use-case';
import {
  INSTITUTION_DISCOVERY_REPOSITORY,
} from './application/ports/institution-discovery.repository';
import { GetInstitutionDiscoveryUseCase } from './application/use-cases/get-institution-discovery.use-case';
import { GetInstitutionOverviewUseCase } from './application/use-cases/get-institution-overview.use-case';
import { GetInstitutionsUseCase } from './application/use-cases/get-institutions.use-case';
import { UpdateInstitutionDiscoveryCacheUseCase } from './application/use-cases/update-institution-discovery-cache.use-case';
import { InstitutionLinkDiscoveryService } from './domain/services/institution-link-discovery.service';
import { InstitutionIntelligenceController } from './institution-intelligence.controller';
import { InstitutionHomepageSourceGateway } from './infrastructure/gateways/institution-homepage-source.gateway';
import { RedisInstitutionDiscoveryRepository } from './infrastructure/persistence/redis-institution-discovery.repository';
import { InstitutionIntelligenceService } from './institution-intelligence.service';

@Module({
  imports: [MenuModule, NoticeModule, SourceRegistryModule, RedisModule],
  controllers: [InstitutionIntelligenceController],
  providers: [
    InstitutionIntelligenceService,
    GetInstitutionsUseCase,
    GetInstitutionCatalogUseCase,
    GetInstitutionDiscoveryUseCase,
    GetInstitutionOverviewUseCase,
    UpdateInstitutionDiscoveryCacheUseCase,
    InstitutionLinkDiscoveryService,
    InstitutionHomepageSourceGateway,
    RedisInstitutionDiscoveryRepository,
    {
      provide: INSTITUTION_DISCOVERY_REPOSITORY,
      useExisting: RedisInstitutionDiscoveryRepository,
    },
  ],
  exports: [INSTITUTION_DISCOVERY_REPOSITORY],
})
export class InstitutionIntelligenceModule {}
