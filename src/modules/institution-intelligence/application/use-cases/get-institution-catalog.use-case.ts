import { Injectable, NotFoundException } from '@nestjs/common';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import {
  getInstitutionRegistryEntry,
  InstitutionType,
} from '../../constants/institution-registry.constant';
import { InstitutionCatalogResponseDto } from '../../dto/institution.response.dto';
import { getInstitutionSourceCatalogEntries } from '../../data/institution-source-catalog.data';
import {
  getInstitutionRegisteredSourceIds,
  mapInstitutionRegistryItem,
} from '../../utils/institution-registry-response.util';

@Injectable()
export class GetInstitutionCatalogUseCase {
  constructor(private readonly sourceRegistryService: SourceRegistryService) {}

  execute(institution: InstitutionType): InstitutionCatalogResponseDto {
    const registryEntry = getInstitutionRegistryEntry(institution);

    if (!registryEntry) {
      throw new NotFoundException(`Unsupported institution: ${institution}`);
    }

    const services = getInstitutionSourceCatalogEntries(institution);
    const registeredSourceIds = getInstitutionRegisteredSourceIds(registryEntry);
    const registeredSources = this.sourceRegistryService
      .list()
      .filter((source) => registeredSourceIds.includes(source.id))
      .sort((left, right) => left.id.localeCompare(right.id));

    return {
      generatedAt: new Date().toISOString(),
      institution: mapInstitutionRegistryItem(registryEntry),
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
