import { Injectable } from '@nestjs/common';
import {
  INSTITUTION_OPPORTUNITY_SERVICE_TYPES,
  InstitutionOpportunityDiscoveryMode,
} from '../../constants/institution-opportunity.constant';
import { InstitutionRegistryEntry } from '../../constants/institution-registry.constant';
import { InstitutionSourceCatalogEntry } from '../../data/institution-source-catalog.data';
import { InstitutionDiscoveryResponseDto } from '../../dto/institution.response.dto';
import { InstitutionDiscoverySnapshot } from '../types/institution-discovery.type';
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
    return this.buildFromSections(
      registryEntry,
      discovery.sections,
      discovery.snapshot,
      discovery.summary.mode as InstitutionOpportunityDiscoveryMode,
      catalog,
    );
  }

  buildFromSnapshot(
    registryEntry: InstitutionRegistryEntry,
    snapshot: InstitutionDiscoverySnapshot,
    snapshotMetadata: InstitutionOpportunityCollection['snapshot'],
    catalog: InstitutionSourceCatalogEntry[],
  ): InstitutionOpportunityCollection {
    return this.buildFromSections(
      registryEntry,
      snapshot.sections.map((section) => ({
        ...section,
        linkCount: section.links.length,
      })),
      snapshotMetadata,
      snapshot.mode as InstitutionOpportunityDiscoveryMode,
      catalog,
    );
  }

  private buildFromSections(
    registryEntry: InstitutionRegistryEntry,
    sections: Array<{
      serviceType: InstitutionDiscoveryResponseDto['sections'][number]['serviceType'];
      links: InstitutionDiscoveryResponseDto['sections'][number]['links'];
    }>,
    snapshot: InstitutionDiscoveryResponseDto['snapshot'],
    mode: InstitutionOpportunityDiscoveryMode,
    catalog: InstitutionSourceCatalogEntry[],
  ): InstitutionOpportunityCollection {
    const items = new Map<string, InstitutionOpportunityItem>();
    const catalogByServiceType = new Map(
      catalog.map((entry) => [entry.serviceType, entry]),
    );

    for (const section of sections) {
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

        const rank = this.computeRank(link.score, link.recordType, link.postedAt, mode);

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
          rank,
          discoveryMode: mode,
          recordType: link.recordType,
          excerpt: link.excerpt,
          postedAt: link.postedAt,
          sourceId: snapshot.sourceIds[0],
        });
      }
    }

    return {
      items: Array.from(items.values()).sort((left, right) => {
        if (right.rank !== left.rank) {
          return right.rank - left.rank;
        }

        if (left.postedAt && right.postedAt && left.postedAt !== right.postedAt) {
          return right.postedAt.localeCompare(left.postedAt);
        }

        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return left.title.localeCompare(right.title, 'ko');
      }),
      snapshot,
      mode,
    };
  }

  private normalizeUrl(url: string): string {
    return url.trim();
  }

  private computeRank(
    score: number,
    recordType: InstitutionOpportunityItem['recordType'],
    postedAt: string | undefined,
    mode: InstitutionOpportunityDiscoveryMode,
  ): number {
    let rank = score * 10;

    if (recordType === 'post') {
      rank += 40;
    } else if (recordType === 'program') {
      rank += 30;
    } else if (recordType === 'listing') {
      rank += 10;
    }

    if (postedAt) {
      const daysOld = Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(`${postedAt}T00:00:00.000Z`).getTime()) /
            86_400_000,
        ),
      );
      rank += Math.max(0, 14 - Math.min(daysOld, 14));
    }

    if (mode === 'live') {
      rank += 5;
    }

    return Number(rank.toFixed(2));
  }
}
