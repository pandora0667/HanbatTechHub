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

export function mergeSnapshotMetadata(
  snapshots: SnapshotMetadata[],
): SnapshotMetadata | undefined {
  if (snapshots.length === 0) {
    return undefined;
  }

  const collectedAt = Math.min(
    ...snapshots.map((snapshot) => new Date(snapshot.collectedAt).getTime()),
  );
  const staleAt = Math.min(
    ...snapshots.map((snapshot) => new Date(snapshot.staleAt).getTime()),
  );

  return {
    collectedAt: new Date(collectedAt).toISOString(),
    staleAt: new Date(staleAt).toISOString(),
    ttlSeconds: Math.min(...snapshots.map((snapshot) => snapshot.ttlSeconds)),
    confidence: Math.min(...snapshots.map((snapshot) => snapshot.confidence)),
    sourceIds: Array.from(
      new Set(snapshots.flatMap((snapshot) => snapshot.sourceIds)),
    ).sort(),
  };
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
