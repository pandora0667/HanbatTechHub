import { Injectable } from '@nestjs/common';
import { SourceHealthResponseDto } from '../../dto/source-health.response.dto';
import { SourceRegistryService } from '../../source-registry.service';
import { SourceRuntimeStatusService } from '../services/source-runtime-status.service';
import { isSnapshotStale } from '../../../../common/utils/snapshot.util';

@Injectable()
export class GetSourceHealthUseCase {
  constructor(
    private readonly sourceRegistryService: SourceRegistryService,
    private readonly sourceRuntimeStatusService: SourceRuntimeStatusService,
  ) {}

  async execute(): Promise<SourceHealthResponseDto> {
    const generatedAt = new Date().toISOString();
    const sources = await Promise.all(
      this.sourceRegistryService.list().map(async (source) => {
        const lastSuccessAt = await this.sourceRuntimeStatusService.getLastSuccessAt(
          source.id,
        );
        const freshnessStatus = this.resolveFreshnessStatus(source, lastSuccessAt);
        const nextEligibleCollectionAt = lastSuccessAt
          ? new Date(
              new Date(lastSuccessAt).getTime() +
                source.minimumIntervalHours * 60 * 60 * 1000,
            ).toISOString()
          : undefined;

        return {
          sourceId: source.id,
          name: source.name,
          provider: source.provider,
          context: source.context,
          collectionMode: source.collectionMode,
          tier: source.tier,
          state: source.state,
          riskTier: source.riskTier,
          safeCollectionPolicy: source.safeCollectionPolicy,
          maxCollectionsPerDay: source.maxCollectionsPerDay,
          minimumIntervalHours: source.minimumIntervalHours,
          confidence: source.confidence,
          freshnessStatus,
          lastSuccessAt: lastSuccessAt ?? undefined,
          lastFailureAt: null,
          failureCount: 0,
          nextEligibleCollectionAt,
        };
      }),
    );

    return {
      generatedAt,
      sources,
    };
  }

  private resolveFreshnessStatus(
    source: { freshnessTtlSeconds: number },
    lastSuccessAt: string | null,
  ) {
    if (!lastSuccessAt) {
      return 'missing';
    }

    const stale = isSnapshotStale(
      {
        collectedAt: lastSuccessAt,
        staleAt: new Date(
          new Date(lastSuccessAt).getTime() +
            source.freshnessTtlSeconds * 1000,
        ).toISOString(),
        ttlSeconds: source.freshnessTtlSeconds,
        confidence: 1,
        sourceIds: [],
      },
      new Date(),
    );

    return stale ? 'stale' : 'fresh';
  }
}
