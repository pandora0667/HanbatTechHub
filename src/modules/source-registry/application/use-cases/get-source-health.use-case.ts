import { Injectable } from '@nestjs/common';
import { SourceHealthResponseDto } from '../../dto/source-health.response.dto';
import { SourceRegistryService } from '../../source-registry.service';
import { SourceRuntimeStatusService } from '../services/source-runtime-status.service';
import { isSnapshotStale } from '../../../../common/utils/snapshot.util';
import { SourceRuntimeStatus } from '../../types/source-runtime.type';

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
        const runtimeRecord =
          await this.sourceRuntimeStatusService.getRuntimeRecord(source.id);
        const freshnessStatus = this.resolveFreshnessStatus(source, lastSuccessAt);
        const lastAttemptAt =
          runtimeRecord?.lastFailureAt &&
          (!lastSuccessAt ||
            new Date(runtimeRecord.lastFailureAt).getTime() >
              new Date(lastSuccessAt).getTime())
            ? runtimeRecord.lastFailureAt
            : lastSuccessAt;
        const nextEligibleCollectionAt = lastAttemptAt
          ? new Date(
              new Date(lastAttemptAt).getTime() +
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
          effectiveState: this.resolveEffectiveState(source.state, runtimeRecord),
          runtimeStatus: this.resolveRuntimeStatus(
            source.state,
            runtimeRecord,
            lastSuccessAt,
          ),
          freshnessStatus,
          lastSuccessAt: lastSuccessAt ?? undefined,
          lastFailureAt: runtimeRecord?.lastFailureAt ?? null,
          failureCount: runtimeRecord?.failureCount ?? 0,
          consecutiveFailures: runtimeRecord?.consecutiveFailures ?? 0,
          lastErrorMessage: runtimeRecord?.lastErrorMessage,
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

  private resolveEffectiveState(
    configuredState: 'active' | 'paused' | 'disabled',
    runtimeRecord:
      | {
          consecutiveFailures: number;
        }
      | null
      | undefined,
  ): 'active' | 'paused' | 'disabled' {
    if (configuredState === 'disabled') {
      return 'disabled';
    }

    if (configuredState === 'paused') {
      return 'paused';
    }

    return (runtimeRecord?.consecutiveFailures ?? 0) >= 3 ? 'paused' : 'active';
  }

  private resolveRuntimeStatus(
    configuredState: 'active' | 'paused' | 'disabled',
    runtimeRecord:
      | {
          consecutiveFailures: number;
        }
      | null
      | undefined,
    lastSuccessAt: string | null,
  ): SourceRuntimeStatus {
    if (configuredState === 'disabled') {
      return 'failing';
    }

    const consecutiveFailures = runtimeRecord?.consecutiveFailures ?? 0;

    if (consecutiveFailures >= 3) {
      return 'failing';
    }

    if (consecutiveFailures > 0) {
      return 'degraded';
    }

    return lastSuccessAt ? 'healthy' : 'unknown';
  }
}
