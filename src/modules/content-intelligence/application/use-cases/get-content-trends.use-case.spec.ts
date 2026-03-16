import { Test } from '@nestjs/testing';
import {
  BLOG_POST_REPOSITORY,
} from '../../../blog/application/ports/blog-post.repository';
import {
  BLOG_SOURCE_CATALOG,
} from '../../../blog/application/ports/blog-source-catalog';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { GetContentTrendsUseCase } from './get-content-trends.use-case';
import { ContentSnapshotHistoryBuilderService } from '../../domain/services/content-snapshot-history-builder.service';
import { ContentTopicExtractorService } from '../../domain/services/content-topic-extractor.service';

describe('GetContentTrendsUseCase', () => {
  const blogPostRepository = {
    getPostsForCompanies: jest.fn(),
    getCompanyLastUpdate: jest.fn(),
    getContentSnapshotHistory: jest.fn(),
  };
  const blogSourceCatalog = {
    listCodes: jest.fn(() => ['NAVER_D2']),
  };
  const sourceRegistryService = {
    list: jest.fn(() => [{ id: 'content.blog.naver_d2', name: 'NAVER D2' }]),
  };

  let useCase: GetContentTrendsUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetContentTrendsUseCase,
        ContentTopicExtractorService,
        ContentSnapshotHistoryBuilderService,
        {
          provide: BLOG_POST_REPOSITORY,
          useValue: blogPostRepository,
        },
        {
          provide: BLOG_SOURCE_CATALOG,
          useValue: blogSourceCatalog,
        },
        {
          provide: SourceRegistryService,
          useValue: sourceRegistryService,
        },
      ],
    }).compile();

    useCase = moduleRef.get(GetContentTrendsUseCase);
  });

  it('extracts trending topics from cached content snapshots', async () => {
    blogPostRepository.getPostsForCompanies.mockResolvedValue([
      {
        id: '1',
        company: 'NAVER_D2',
        title: 'TypeScript Runtime',
        description: 'TypeScript service layer',
        link: 'https://example.com/1',
        publishDate: new Date(),
        isTranslated: true,
      },
      {
        id: '2',
        company: 'NAVER_D2',
        title: 'TypeScript Tooling',
        description: 'TypeScript infrastructure',
        link: 'https://example.com/2',
        publishDate: new Date(),
        isTranslated: true,
      },
    ]);
    blogPostRepository.getCompanyLastUpdate.mockResolvedValue(
      '2026-03-14T00:00:00.000Z',
    );
    blogPostRepository.getContentSnapshotHistory.mockResolvedValue([
      {
        snapshot: {
          collectedAt: '2026-03-10T00:00:00.000Z',
          staleAt: '2026-03-11T00:00:00.000Z',
          ttlSeconds: 86400,
          confidence: 0.9,
          sourceIds: ['content.blog.naver_d2'],
        },
        summary: {
          totalItems: 1,
          companies: 1,
          topicsTracked: 1,
          windowDays: 30,
        },
        companies: [{ company: 'NAVER_D2', items: 1 }],
        topics: [{ topic: 'typescript', mentions: 1, companies: 1 }],
      },
    ]);

    const result = await useCase.execute({
      days: 30,
      minMentions: 2,
      limit: 10,
      historyPoints: 10,
      trendLimit: 5,
    });

    expect(result.summary.totalTopics).toBeGreaterThan(0);
    expect(result.summary.historyPoints).toBe(2);
    expect(result.trends[0]).toEqual(
      expect.objectContaining({
        topic: expect.any(String),
        mentions: expect.any(Number),
      }),
    );
    expect(result.history).toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          historyPoints: 2,
          totalItemsDelta: expect.any(Number),
        }),
        timeline: expect.any(Array),
        topicMomentum: expect.any(Array),
      }),
    );
  });
});
