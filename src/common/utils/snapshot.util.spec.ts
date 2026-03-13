import {
  buildSnapshotMetadata,
  isSnapshotStale,
  mergeSnapshotMetadata,
} from './snapshot.util';

describe('snapshot.util', () => {
  it('builds snapshot metadata with deduplicated source ids and stale time', () => {
    const snapshot = buildSnapshotMetadata({
      collectedAt: '2026-03-13T00:00:00.000Z',
      ttlSeconds: 3600,
      confidence: 0.836,
      sourceIds: ['opportunity.jobs.line', 'opportunity.jobs.line'],
    });

    expect(snapshot).toEqual({
      collectedAt: '2026-03-13T00:00:00.000Z',
      staleAt: '2026-03-13T01:00:00.000Z',
      ttlSeconds: 3600,
      confidence: 0.84,
      sourceIds: ['opportunity.jobs.line'],
    });
  });

  it('detects stale snapshots', () => {
    const snapshot = buildSnapshotMetadata({
      collectedAt: '2026-03-13T00:00:00.000Z',
      ttlSeconds: 60,
      confidence: 0.8,
      sourceIds: ['content.blog.toss'],
    });

    expect(isSnapshotStale(snapshot, new Date('2026-03-13T00:00:30.000Z'))).toBe(
      false,
    );
    expect(isSnapshotStale(snapshot, new Date('2026-03-13T00:01:00.000Z'))).toBe(
      true,
    );
  });

  it('merges multiple snapshots conservatively', () => {
    const merged = mergeSnapshotMetadata([
      buildSnapshotMetadata({
        collectedAt: '2026-03-13T01:00:00.000Z',
        ttlSeconds: 3600,
        confidence: 0.9,
        sourceIds: ['content.blog.toss'],
      }),
      buildSnapshotMetadata({
        collectedAt: '2026-03-13T00:00:00.000Z',
        ttlSeconds: 1800,
        confidence: 0.75,
        sourceIds: ['content.blog.line'],
      }),
    ]);

    expect(merged).toEqual({
      collectedAt: '2026-03-13T00:00:00.000Z',
      staleAt: '2026-03-13T00:30:00.000Z',
      ttlSeconds: 1800,
      confidence: 0.75,
      sourceIds: ['content.blog.line', 'content.blog.toss'],
    });
  });
});
