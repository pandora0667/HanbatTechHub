import { Injectable, NotFoundException } from '@nestjs/common';
import { paginateArray } from '../../../../common/utils/pagination.util';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import {
  getInstitutionRegistryEntry,
  InstitutionType,
} from '../../constants/institution-registry.constant';
import { getInstitutionSourceCatalogEntries } from '../../data/institution-source-catalog.data';
import { InstitutionOpportunitiesResponseDto } from '../../dto/institution.response.dto';
import { GetInstitutionOpportunitiesQueryDto } from '../../dto/get-institution-opportunities-query.dto';
import { InstitutionOpportunityBuilderService } from '../../domain/services/institution-opportunity-builder.service';
import { GetInstitutionDiscoveryUseCase } from './get-institution-discovery.use-case';
import { mapInstitutionRegistryItem } from '../../utils/institution-registry-response.util';

@Injectable()
export class GetInstitutionOpportunitiesUseCase {
  constructor(
    private readonly getInstitutionDiscoveryUseCase: GetInstitutionDiscoveryUseCase,
    private readonly institutionOpportunityBuilderService: InstitutionOpportunityBuilderService,
    private readonly sourceRegistryService: SourceRegistryService,
  ) {}

  async execute(
    institution: InstitutionType,
    query: GetInstitutionOpportunitiesQueryDto,
  ): Promise<InstitutionOpportunitiesResponseDto> {
    const registryEntry = getInstitutionRegistryEntry(institution);

    if (!registryEntry) {
      throw new NotFoundException(`Unsupported institution: ${institution}`);
    }

    const [discovery, catalog] = await Promise.all([
      this.getInstitutionDiscoveryUseCase.execute(institution),
      Promise.resolve(getInstitutionSourceCatalogEntries(institution)),
    ]);
    const collection = this.institutionOpportunityBuilderService.build(
      registryEntry,
      discovery,
      catalog,
    );
    const filteredItems = this.filterItems(collection.items, query);
    const paginated = paginateArray(
      filteredItems,
      query.page ?? 1,
      query.limit ?? 20,
      20,
    );

    return {
      generatedAt: new Date().toISOString(),
      institution: mapInstitutionRegistryItem(registryEntry),
      snapshot: collection.snapshot,
      summary: {
        totalOpportunities: filteredItems.length,
        serviceTypesCovered: new Set(
          filteredItems.map((item) => item.serviceType),
        ).size,
        liveInstitutions: collection.mode === 'live' ? 1 : 0,
        fallbackInstitutions: collection.mode === 'catalog_fallback' ? 1 : 0,
      },
      meta: {
        ...paginated.meta,
        limit: query.limit ?? 20,
        serviceType: query.serviceType,
        keyword: query.keyword,
        snapshot: collection.snapshot,
      },
      items: paginated.items,
      sources: this.sourceRegistryService
        .list()
        .filter((source) => collection.snapshot.sourceIds.includes(source.id))
        .sort((left, right) => left.id.localeCompare(right.id)),
    };
  }

  private filterItems(
    items: InstitutionOpportunitiesResponseDto['items'],
    query: GetInstitutionOpportunitiesQueryDto,
  ) {
    return items.filter((item) => {
      if (query.serviceType && item.serviceType !== query.serviceType) {
        return false;
      }

      if (!query.keyword) {
        return true;
      }

      const keyword = query.keyword.trim().toLowerCase();
      if (!keyword) {
        return true;
      }

      return [item.title, item.institutionName, item.region, ...item.matchedKeywords]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });
  }
}
