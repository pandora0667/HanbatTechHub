import { Inject, Injectable } from '@nestjs/common';
import {
  buildSnapshotMetadata,
  mergeSnapshotMetadata,
} from '../../../../common/utils/snapshot.util';
import {
  INSTITUTION_DISCOVERY_REPOSITORY,
  InstitutionDiscoveryRepository,
} from '../../../institution-intelligence/application/ports/institution-discovery.repository';
import {
  INSTITUTION_DISCOVERY_CACHE_TTL,
  INSTITUTION_DISCOVERY_FALLBACK_CONFIDENCE,
  INSTITUTION_DISCOVERY_SOURCE_CONFIDENCE,
  getInstitutionDiscoverySourceId,
} from '../../../institution-intelligence/constants/institution-discovery.constant';
import { INSTITUTION_REGISTRY } from '../../../institution-intelligence/constants/institution-registry.constant';
import {
  InstitutionOpportunityDiscoveryMode,
} from '../../../institution-intelligence/constants/institution-opportunity.constant';
import { InstitutionServiceType } from '../../../institution-intelligence/constants/institution-service-type.enum';
import { getInstitutionSourceCatalogEntries } from '../../../institution-intelligence/data/institution-source-catalog.data';
import { parseInstitutionFilter } from '../../../institution-intelligence/dto/get-institution-opportunities-query.dto';
import { InstitutionOpportunityBuilderService } from '../../../institution-intelligence/domain/services/institution-opportunity-builder.service';
import { GetInstitutionDiscoveryUseCase } from '../../../institution-intelligence/application/use-cases/get-institution-discovery.use-case';
import {
  InstitutionOpportunityChangeResult,
  InstitutionOpportunityChangeSummary,
  InstitutionOpportunityChangeType,
} from '../../domain/models/institution-opportunity-change-signal.model';
import { InstitutionOpportunityChangeDetectorService } from '../../domain/services/institution-opportunity-change-detector.service';

export interface GetInstitutionOpportunityChangeSignalsQuery {
  institutions?: string;
  rolloutWave?: 1 | 2 | 3;
  region?: string;
  serviceType?: InstitutionServiceType;
  changeType?: InstitutionOpportunityChangeType;
  mode?: InstitutionOpportunityDiscoveryMode;
  limit?: number;
}

@Injectable()
export class GetInstitutionOpportunityChangeSignalsUseCase {
  constructor(
    @Inject(INSTITUTION_DISCOVERY_REPOSITORY)
    private readonly institutionDiscoveryRepository: InstitutionDiscoveryRepository,
    private readonly getInstitutionDiscoveryUseCase: GetInstitutionDiscoveryUseCase,
    private readonly institutionOpportunityBuilderService: InstitutionOpportunityBuilderService,
    private readonly institutionOpportunityChangeDetectorService: InstitutionOpportunityChangeDetectorService,
  ) {}

  async execute(
    query: GetInstitutionOpportunityChangeSignalsQuery = {},
  ): Promise<InstitutionOpportunityChangeResult> {
    const institutionFilter = parseInstitutionFilter(query.institutions);
    const targetedInstitutions = INSTITUTION_REGISTRY.filter((entry) => {
      if (institutionFilter && !institutionFilter.includes(entry.id)) {
        return false;
      }

      if (query.rolloutWave && entry.rolloutWave !== query.rolloutWave) {
        return false;
      }

      if (
        query.region &&
        !entry.region.toLowerCase().includes(query.region.trim().toLowerCase())
      ) {
        return false;
      }

      return true;
    });
    const generatedAt = new Date().toISOString();

    if (targetedInstitutions.length === 0) {
      return this.createEmptyResult(generatedAt);
    }

    const signalResults = await Promise.all(
      targetedInstitutions.map(async (institution) => {
        await this.getInstitutionDiscoveryUseCase.execute(institution.id);

        const [currentSnapshot, previousSnapshot] = await Promise.all([
          this.institutionDiscoveryRepository.getSnapshot(institution.id),
          this.institutionDiscoveryRepository.getPreviousSnapshot(institution.id),
        ]);

        if (!currentSnapshot) {
          return null;
        }

        if (query.mode && currentSnapshot.mode !== query.mode) {
          return null;
        }

        if (!previousSnapshot) {
          return {
            baselineCollectedAt: undefined,
            snapshot: this.buildSnapshot(currentSnapshot, institution.id),
            signals: [],
          };
        }

        const catalog = getInstitutionSourceCatalogEntries(institution.id);
        const currentCollection =
          this.institutionOpportunityBuilderService.buildFromSnapshot(
            institution,
            currentSnapshot,
            this.buildSnapshot(currentSnapshot, institution.id),
            catalog,
          );
        const previousCollection =
          this.institutionOpportunityBuilderService.buildFromSnapshot(
            institution,
            previousSnapshot,
            this.buildSnapshot(previousSnapshot, institution.id),
            catalog,
          );
        const result = this.institutionOpportunityChangeDetectorService.detect({
          previousItems: previousCollection.items,
          currentItems: currentCollection.items,
          generatedAt,
          baselineCollectedAt: previousSnapshot.collectedAt,
          snapshot: currentCollection.snapshot,
        });

        return result;
      }),
    );

    let signals = signalResults
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .flatMap((result) => result.signals);

    if (query.serviceType) {
      signals = signals.filter((signal) => signal.serviceType === query.serviceType);
    }

    if (query.changeType) {
      signals = signals.filter((signal) => signal.changeType === query.changeType);
    }

    if (query.limit) {
      signals = signals.slice(0, query.limit);
    }

    const snapshots = signalResults
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .map((result) => result.snapshot)
      .filter((snapshot) => snapshot !== undefined);
    const baselineCollectedAt = signalResults
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .map((result) => result.baselineCollectedAt)
      .filter((baseline): baseline is string => baseline !== undefined)
      .sort()[0];

    return {
      generatedAt,
      baselineCollectedAt,
      snapshot: mergeSnapshotMetadata(snapshots),
      summary: this.summarize(signals),
      signals,
    };
  }

  private buildSnapshot(
    snapshot: {
      collectedAt: string;
      mode: 'live' | 'catalog_fallback';
    },
    institutionId: (typeof INSTITUTION_REGISTRY)[number]['id'],
  ) {
    return buildSnapshotMetadata({
      collectedAt: snapshot.collectedAt,
      ttlSeconds: INSTITUTION_DISCOVERY_CACHE_TTL,
      confidence:
        snapshot.mode === 'catalog_fallback'
          ? INSTITUTION_DISCOVERY_FALLBACK_CONFIDENCE
          : INSTITUTION_DISCOVERY_SOURCE_CONFIDENCE,
      sourceIds: [getInstitutionDiscoverySourceId(institutionId)],
    });
  }

  private createEmptyResult(generatedAt: string): InstitutionOpportunityChangeResult {
    return {
      generatedAt,
      summary: {
        total: 0,
        created: 0,
        updated: 0,
        removed: 0,
      },
      signals: [],
    };
  }

  private summarize(
    signals: InstitutionOpportunityChangeResult['signals'],
  ): InstitutionOpportunityChangeSummary {
    return signals.reduce<InstitutionOpportunityChangeSummary>(
      (summary, signal) => {
        summary.total += 1;

        if (signal.changeType === 'new') {
          summary.created += 1;
        } else if (signal.changeType === 'updated') {
          summary.updated += 1;
        } else {
          summary.removed += 1;
        }

        return summary;
      },
      {
        total: 0,
        created: 0,
        updated: 0,
        removed: 0,
      },
    );
  }
}
