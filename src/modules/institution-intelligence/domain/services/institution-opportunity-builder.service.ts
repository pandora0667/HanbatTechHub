import { Injectable } from '@nestjs/common';
import {
  INSTITUTION_OPPORTUNITY_SERVICE_TYPES,
  InstitutionOpportunityDiscoveryMode,
} from '../../constants/institution-opportunity.constant';
import { InstitutionRegistryEntry } from '../../constants/institution-registry.constant';
import { InstitutionSourceCatalogEntry } from '../../data/institution-source-catalog.data';
import { InstitutionDiscoveryResponseDto } from '../../dto/institution.response.dto';
import {
  InstitutionOpportunityCollection,
  InstitutionOpportunityItem,
} from '../types/institution-opportunity.type';

@Injectable()
export class InstitutionOpportunityBuilderService {
  build(
    registryEntry: InstitutionRegistryEntry,
    discovery: InstitutionDiscoveryResponseDto,
    catalog: InstitutionSourceCatalogEntry[],
  ): InstitutionOpportunityCollection {
    const items = new Map<string, InstitutionOpportunityItem>();
    const catalogByServiceType = new Map(
      catalog.map((entry) => [entry.serviceType, entry]),
    );

    for (const section of discovery.sections) {
      if (!INSTITUTION_OPPORTUNITY_SERVICE_TYPES.includes(section.serviceType)) {
        continue;
      }

      const blueprint = catalogByServiceType.get(section.serviceType);

      for (const link of section.links) {
        const normalizedUrl = this.normalizeUrl(link.url);
        const dedupeKey = `${section.serviceType}:${normalizedUrl}`;

        if (items.has(dedupeKey)) {
          continue;
        }

        items.set(dedupeKey, {
          id: `${registryEntry.id}:${section.serviceType}:${Buffer.from(normalizedUrl).toString('base64url')}`,
          institutionId: registryEntry.id,
          institutionName: registryEntry.name,
          region: registryEntry.region,
          serviceType: section.serviceType,
          title: link.title || blueprint?.name || `${registryEntry.name} ${section.serviceType}`,
          url: normalizedUrl,
          pageUrl: this.normalizeUrl(link.pageUrl),
          matchedKeywords: [...link.matchedKeywords],
          score: link.score,
          discoveryMode: discovery.summary.mode as InstitutionOpportunityDiscoveryMode,
          sourceId: discovery.snapshot.sourceIds[0],
        });
      }
    }

    return {
      items: Array.from(items.values()).sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return left.title.localeCompare(right.title, 'ko');
      }),
      snapshot: discovery.snapshot,
      mode: discovery.summary.mode as InstitutionOpportunityDiscoveryMode,
    };
  }

  private normalizeUrl(url: string): string {
    return url.trim();
  }
}
