import { Injectable, NotFoundException } from '@nestjs/common';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import {
  getInstitutionRegistryEntry,
  InstitutionType,
} from '../../constants/institution-registry.constant';
import { InstitutionCatalogResponseDto } from '../../dto/institution.response.dto';
import { getInstitutionSourceCatalogEntries } from '../../data/institution-source-catalog.data';

@Injectable()
export class GetInstitutionCatalogUseCase {
  constructor(private readonly sourceRegistryService: SourceRegistryService) {}

  execute(institution: InstitutionType): InstitutionCatalogResponseDto {
    const registryEntry = getInstitutionRegistryEntry(institution);

    if (!registryEntry) {
      throw new NotFoundException(`Unsupported institution: ${institution}`);
    }

    const services = getInstitutionSourceCatalogEntries(institution);
    const registeredSources = this.sourceRegistryService
      .list()
      .filter((source) => registryEntry.sourceIds.includes(source.id))
      .sort((left, right) => left.id.localeCompare(right.id));

    return {
      generatedAt: new Date().toISOString(),
      institution: {
        id: registryEntry.id,
        name: registryEntry.name,
        region: registryEntry.region,
        audience: registryEntry.audience,
        institutionType: registryEntry.institutionType,
        officialEntryUrl: registryEntry.officialEntryUrl,
        siteFamily: registryEntry.siteFamily,
        rolloutWave: registryEntry.rolloutWave,
        rolloutStatus: registryEntry.rolloutStatus,
        overviewAvailable: registryEntry.sourceIds.length > 0,
        priorityServiceTypes: [...registryEntry.priorityServiceTypes],
        implementedServiceTypes: [...registryEntry.implementedServiceTypes],
        sourceIds: [...registryEntry.sourceIds],
      },
      summary: {
        totalBlueprints: services.length,
        implementedBlueprints: services.filter(
          (service) => service.implementationStatus === 'implemented',
        ).length,
        registeredSources: registeredSources.length,
      },
      services,
      registeredSources,
    };
  }
}
