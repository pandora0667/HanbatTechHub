import { Module } from '@nestjs/common';
import { MenuModule } from '../menu/menu.module';
import { NoticeModule } from '../notice/notice.module';
import { SourceRegistryModule } from '../source-registry/source-registry.module';
import { GetInstitutionCatalogUseCase } from './application/use-cases/get-institution-catalog.use-case';
import { GetInstitutionOverviewUseCase } from './application/use-cases/get-institution-overview.use-case';
import { GetInstitutionsUseCase } from './application/use-cases/get-institutions.use-case';
import { InstitutionIntelligenceController } from './institution-intelligence.controller';
import { InstitutionIntelligenceService } from './institution-intelligence.service';

@Module({
  imports: [MenuModule, NoticeModule, SourceRegistryModule],
  controllers: [InstitutionIntelligenceController],
  providers: [
    InstitutionIntelligenceService,
    GetInstitutionsUseCase,
    GetInstitutionCatalogUseCase,
    GetInstitutionOverviewUseCase,
  ],
})
export class InstitutionIntelligenceModule {}
