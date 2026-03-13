import { Test } from '@nestjs/testing';
import {
  BLOG_POST_REPOSITORY,
} from '../../../blog/application/ports/blog-post.repository';
import {
  BLOG_SOURCE_CATALOG,
} from '../../../blog/application/ports/blog-source-catalog';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { GetContentFeedUseCase } from './get-content-feed.use-case';

describe('GetContentFeedUseCase', () => {
  const blogPostRepository = {
    getPostsForCompanies: jest.fn(),
    getCompanyLastUpdate: jest.fn(),
  };
  const blogSourceCatalog = {
    listCodes: jest.fn(() => ['NAVER_D2', 'KAKAO_ENTERPRISE']),
  };
  const sourceRegistryService = {
    list: jest.fn(() => [
      { id: 'content.blog.naver_d2', name: 'NAVER D2' },
      { id: 'content.blog.kakao_enterprise', name: 'KAKAO ENTERPRISE' },
    ]),
  };

  let useCase: GetContentFeedUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetContentFeedUseCase,
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

    useCase = moduleRef.get(GetContentFeedUseCase);
  });

  it('builds a filtered content feed from cached posts', async () => {
    blogPostRepository.getPostsForCompanies.mockResolvedValue([
      {
        id: '1',
        company: 'NAVER_D2',
        title: 'TypeScript at Scale',
        description: 'desc',
        link: 'https://example.com/1',
        publishDate: new Date('2026-03-10T00:00:00.000Z'),
        isTranslated: true,
      },
      {
        id: '2',
        company: 'KAKAO_ENTERPRISE',
        title: 'Java Platform',
        description: 'desc',
        link: 'https://example.com/2',
        publishDate: new Date('2026-03-11T00:00:00.000Z'),
        isTranslated: true,
      },
    ]);
    blogPostRepository.getCompanyLastUpdate.mockResolvedValue(
      '2026-03-14T00:00:00.000Z',
    );

    const result = await useCase.execute({
      keyword: 'typescript',
      page: 1,
      limit: 10,
    });

    expect(result.summary.totalItems).toBe(1);
    expect(result.items[0].title).toContain('TypeScript');
  });
});
