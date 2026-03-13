import { SourceRegistryService } from './source-registry.service';

describe('SourceRegistryService', () => {
  const service = new SourceRegistryService();

  it('returns only requested context entries', () => {
    const sources = service.list({ context: 'opportunity' });

    expect(sources.length).toBeGreaterThan(0);
    expect(sources.every((source) => source.context === 'opportunity')).toBe(
      true,
    );
  });

  it('returns browser automation sources when filtered', () => {
    const sources = service.list({ collectionMode: 'browser' });

    expect(sources.length).toBeGreaterThan(0);
    expect(
      sources.every((source) => source.collectionMode === 'browser'),
    ).toBe(true);
  });
});
