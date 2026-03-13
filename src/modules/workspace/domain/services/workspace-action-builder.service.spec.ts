import { WorkspaceActionBuilderService } from './workspace-action-builder.service';

describe('WorkspaceActionBuilderService', () => {
  let service: WorkspaceActionBuilderService;

  beforeEach(() => {
    service = new WorkspaceActionBuilderService();
  });

  it('deduplicates actions that point to the same URL and keeps the higher priority one', () => {
    const ranked = service.rank(
      [
        {
          id: 'review:NAVER:backend',
          type: 'review',
          priority: 'high',
          sourceKind: 'opportunity',
          title: 'Backend Engineer',
          subtitle: 'NAVER',
          reason: '새 공고입니다.',
          url: 'https://careers.example.com/naver/backend',
          company: 'NAVER',
          dueAt: '2026-03-20T00:00:00.000Z',
          labels: ['NAVER', 'review'],
        },
        {
          id: 'apply:NAVER:backend',
          type: 'apply',
          priority: 'urgent',
          sourceKind: 'opportunity',
          title: 'Backend Engineer',
          subtitle: 'NAVER',
          reason: '오늘 마감입니다.',
          url: 'https://careers.example.com/naver/backend',
          company: 'NAVER',
          dueAt: '2026-03-15T00:00:00.000Z',
          labels: ['NAVER', 'apply'],
        },
      ],
      5,
    );

    expect(ranked).toHaveLength(1);
    expect(ranked[0]).toEqual(
      expect.objectContaining({
        id: 'apply:NAVER:backend',
        priority: 'urgent',
        type: 'apply',
      }),
    );
  });
});
