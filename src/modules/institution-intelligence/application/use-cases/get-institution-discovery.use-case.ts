import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import {
  buildSnapshotMetadata,
  isSnapshotStale,
} from '../../../../common/utils/snapshot.util';
import {
  INSTITUTION_DISCOVERY_REPOSITORY,
  InstitutionDiscoveryRepository,
} from '../ports/institution-discovery.repository';
import {
  INSTITUTION_DISCOVERY_CACHE_TTL,
  INSTITUTION_DISCOVERY_FALLBACK_CONFIDENCE,
  INSTITUTION_DISCOVERY_SOURCE_CONFIDENCE,
  getInstitutionDiscoverySourceId,
} from '../../constants/institution-discovery.constant';
import {
  getInstitutionRegistryEntry,
  InstitutionType,
} from '../../constants/institution-registry.constant';
import { InstitutionDiscoveryResponseDto } from '../../dto/institution.response.dto';
import { InstitutionHomepageSourceGateway } from '../../infrastructure/gateways/institution-homepage-source.gateway';
import { InstitutionLinkDiscoveryService } from '../../domain/services/institution-link-discovery.service';
import { InstitutionDiscoverySnapshot } from '../../domain/types/institution-discovery.type';
import { mapInstitutionRegistryItem } from '../../utils/institution-registry-response.util';

interface ExecuteOptions {
  forceRefresh?: boolean;
  allowRefresh?: boolean;
}

@Injectable()
export class GetInstitutionDiscoveryUseCase {
  private readonly logger = new Logger(GetInstitutionDiscoveryUseCase.name);

  constructor(
    @Inject(INSTITUTION_DISCOVERY_REPOSITORY)
    private readonly institutionDiscoveryRepository: InstitutionDiscoveryRepository,
    private readonly institutionHomepageSourceGateway: InstitutionHomepageSourceGateway,
    private readonly institutionLinkDiscoveryService: InstitutionLinkDiscoveryService,
  ) {}

  async execute(
    institution: InstitutionType,
    options?: ExecuteOptions,
  ): Promise<InstitutionDiscoveryResponseDto> {
    const registryEntry = getInstitutionRegistryEntry(institution);

    if (!registryEntry) {
      throw new NotFoundException(`Unsupported institution: ${institution}`);
    }

    const cachedSnapshot = await this.institutionDiscoveryRepository.getSnapshot(
      institution,
    );
    const allowRefresh = options?.allowRefresh === true;
    const shouldRefresh =
      options?.forceRefresh === true ||
      (allowRefresh && (!cachedSnapshot || this.isStale(cachedSnapshot)));

    let snapshot = cachedSnapshot;

    if (!snapshot && !shouldRefresh) {
      snapshot = await this.createAndPersistFallbackSnapshot(registryEntry);
    }

    if (shouldRefresh) {
      try {
        snapshot = await this.refreshSnapshot(institution);
      } catch (error) {
        if (cachedSnapshot) {
          this.logger.warn(
            `Using stale discovery snapshot for ${institution} after refresh failure`,
          );
          snapshot = cachedSnapshot;
        } else {
          snapshot = await this.createAndPersistFallbackSnapshot(registryEntry);
        }
      }
    }

    if (!snapshot) {
      throw new ServiceUnavailableException(
        `Institution discovery is temporarily unavailable for ${institution}`,
      );
    }

    const metadata = this.buildSnapshot(snapshot, institution);
    const coveredSections = snapshot.sections.filter(
      (section) => section.links.length > 0,
    );
    const totalLinks = snapshot.sections.reduce(
      (count, section) => count + section.links.length,
      0,
    );

    return {
      generatedAt: new Date().toISOString(),
      institution: mapInstitutionRegistryItem(registryEntry),
      snapshot: metadata,
      summary: {
        mode: snapshot.mode,
        coveredServiceTypes: coveredSections.length,
        totalRequestedServiceTypes: snapshot.sections.length,
        totalDiscoveredLinks: totalLinks,
        pagesVisited: snapshot.pagesVisited.length,
      },
      sections: snapshot.sections.map((section) => ({
        serviceType: section.serviceType,
        linkCount: section.links.length,
        links: section.links.map((link) => ({
          title: link.title,
          url: link.url,
          pageUrl: link.pageUrl,
          matchedKeywords: [...link.matchedKeywords],
          score: link.score,
        })),
      })),
    };
  }

  private async refreshSnapshot(
    institution: InstitutionType,
  ): Promise<InstitutionDiscoverySnapshot> {
    const registryEntry = getInstitutionRegistryEntry(institution);

    if (!registryEntry) {
      throw new NotFoundException(`Unsupported institution: ${institution}`);
    }

    const pages = await this.institutionHomepageSourceGateway.fetchPages(
      registryEntry,
    );

    if (pages.length === 0) {
      const fallbackSnapshot =
        this.institutionLinkDiscoveryService.buildCatalogFallbackSnapshot(
          registryEntry,
          new Date().toISOString(),
        );

      await this.institutionDiscoveryRepository.saveSnapshot(
        institution,
        fallbackSnapshot,
      );

      return fallbackSnapshot;
    }

    const snapshot = this.institutionLinkDiscoveryService.buildSnapshot(
      registryEntry,
      pages,
      new Date().toISOString(),
    );

    const totalLinks = snapshot.sections.reduce(
      (count, section) => count + section.links.length,
      0,
    );

    if (totalLinks === 0) {
      const fallbackSnapshot =
        this.institutionLinkDiscoveryService.buildCatalogFallbackSnapshot(
          registryEntry,
          snapshot.collectedAt,
        );

      await this.institutionDiscoveryRepository.saveSnapshot(
        institution,
        fallbackSnapshot,
      );

      return fallbackSnapshot;
    }

    await this.institutionDiscoveryRepository.saveSnapshot(institution, snapshot);

    return snapshot;
  }

  private async createAndPersistFallbackSnapshot(
    registryEntry: ReturnType<typeof getInstitutionRegistryEntry>,
  ): Promise<InstitutionDiscoverySnapshot> {
    if (!registryEntry) {
      throw new ServiceUnavailableException(
        'Institution discovery fallback could not be created.',
      );
    }

    const fallbackSnapshot =
      this.institutionLinkDiscoveryService.buildCatalogFallbackSnapshot(
        registryEntry,
        new Date().toISOString(),
      );

    await this.institutionDiscoveryRepository.saveSnapshot(
      registryEntry.id,
      fallbackSnapshot,
    );

    return fallbackSnapshot;
  }

  private isStale(snapshot: InstitutionDiscoverySnapshot): boolean {
    return isSnapshotStale(
      this.buildSnapshot(snapshot, snapshot.institutionId),
      new Date(),
    );
  }

  private buildSnapshot(
    snapshot: InstitutionDiscoverySnapshot,
    institution: InstitutionType,
  ): SnapshotMetadata {
    return buildSnapshotMetadata({
      collectedAt: snapshot.collectedAt,
      ttlSeconds: INSTITUTION_DISCOVERY_CACHE_TTL,
      confidence:
        snapshot.mode === 'catalog_fallback'
          ? INSTITUTION_DISCOVERY_FALLBACK_CONFIDENCE
          : INSTITUTION_DISCOVERY_SOURCE_CONFIDENCE,
      sourceIds: [getInstitutionDiscoverySourceId(institution)],
    });
  }
}
