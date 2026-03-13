import { Injectable } from '@nestjs/common';
import { buildSnapshotMetadata, isSnapshotStale } from '../../../../common/utils/snapshot.util';
import { SourceRegistryEntry } from '../../../../common/types/snapshot.types';
import {
  SourceFreshnessSignal,
  SourceFreshnessStatus,
  SourceFreshnessSummary,
} from '../models/source-freshness-signal.model';

@Injectable()
export class SourceFreshnessEvaluatorService {
  evaluate(
    source: SourceRegistryEntry,
    lastCollectedAt: string | null,
    at: Date = new Date(),
  ): SourceFreshnessSignal {
    if (!lastCollectedAt) {
      return {
        sourceId: source.id,
        name: source.name,
        provider: source.provider,
        context: source.context,
        collectionMode: source.collectionMode,
        tier: source.tier,
        status: 'missing',
        maxCollectionsPerDay: source.maxCollectionsPerDay,
        confidence: source.confidence,
        collectionUrl: source.collectionUrl,
      };
    }

    const snapshot = buildSnapshotMetadata({
      collectedAt: lastCollectedAt,
      ttlSeconds: source.freshnessTtlSeconds,
      confidence: source.confidence,
      sourceIds: [source.id],
    });
    const status: SourceFreshnessStatus = isSnapshotStale(snapshot, at)
      ? 'stale'
      : 'fresh';

    return {
      sourceId: source.id,
      name: source.name,
      provider: source.provider,
      context: source.context,
      collectionMode: source.collectionMode,
      tier: source.tier,
      status,
      maxCollectionsPerDay: source.maxCollectionsPerDay,
      confidence: source.confidence,
      collectionUrl: source.collectionUrl,
      collectedAt: snapshot.collectedAt,
      staleAt: snapshot.staleAt,
      ageSeconds: Math.max(
        0,
        Math.floor((at.getTime() - new Date(snapshot.collectedAt).getTime()) / 1000),
      ),
    };
  }

  summarize(signals: SourceFreshnessSignal[]): SourceFreshnessSummary {
    return signals.reduce<SourceFreshnessSummary>(
      (summary, signal) => {
        summary.total += 1;
        summary[signal.status] += 1;
        return summary;
      },
      {
        total: 0,
        fresh: 0,
        stale: 0,
        missing: 0,
      },
    );
  }
}
