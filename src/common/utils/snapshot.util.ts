import { SnapshotMetadata } from '../types/snapshot.types';

interface BuildSnapshotMetadataInput {
  collectedAt: Date | string;
  ttlSeconds: number;
  confidence: number;
  sourceIds: string[];
}

export function buildSnapshotMetadata(
  input: BuildSnapshotMetadataInput,
): SnapshotMetadata {
  const collectedAt = normalizeDate(input.collectedAt);
  const staleAt = new Date(collectedAt.getTime() + input.ttlSeconds * 1000);

  return {
    collectedAt: collectedAt.toISOString(),
    staleAt: staleAt.toISOString(),
    ttlSeconds: input.ttlSeconds,
    confidence: clampConfidence(input.confidence),
    sourceIds: Array.from(new Set(input.sourceIds.filter(Boolean))).sort(),
  };
}

export function isSnapshotStale(
  snapshot: SnapshotMetadata,
  at: Date = new Date(),
): boolean {
  return new Date(snapshot.staleAt).getTime() <= at.getTime();
}

function normalizeDate(input: Date | string): Date {
  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid snapshot date: ${input}`);
  }

  return date;
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, Number(value.toFixed(2))));
}
