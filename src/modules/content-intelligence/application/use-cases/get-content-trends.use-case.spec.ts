import { Test } from '@nestjs/testing';
import {
  BLOG_POST_REPOSITORY,
} from '../../../blog/application/ports/blog-post.repository';
import {
  BLOG_SOURCE_CATALOG,
} from '../../../blog/application/ports/blog-source-catalog';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { GetContentTrendsUseCase } from './get-content-trends.use-case';
import { ContentTopicExtractorService } from '../../domain/services/content-topic-extractor.service';

describe('GetContentTrendsUseCase', () => {
  const blogPostRepository = {
    getPostsForCompanies: jest.fn(),
    getCompanyLastUpdate: jest.fn(),
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

    const result = await useCase.execute({
      days: 30,
      minMentions: 2,
      limit: 10,
    });

    expect(result.summary.totalTopics).toBeGreaterThan(0);
    expect(result.trends[0]).toEqual(
      expect.objectContaining({
        topic: expect.any(String),
        mentions: expect.any(Number),
      }),
    );
  });
});
