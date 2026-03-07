import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BlogService } from './blog.service';
import { TranslationService } from '../translation/services/translation.service';
import { RedisService } from '../redis/redis.service';
import { BlogPostQueryService } from './domain/services/blog-post-query.service';
import { BlogFeedCollectorService } from './application/services/blog-feed-collector.service';
import { BlogPostTranslationService } from './application/services/blog-post-translation.service';
import { GetAllBlogPostsUseCase } from './application/use-cases/get-all-blog-posts.use-case';
import { GetBlogCompaniesUseCase } from './application/use-cases/get-blog-companies.use-case';
import { GetCompanyBlogPostsUseCase } from './application/use-cases/get-company-blog-posts.use-case';
import { InitializeBlogFeedsUseCase } from './application/use-cases/initialize-blog-feeds.use-case';
import { UpdateBlogFeedsUseCase } from './application/use-cases/update-blog-feeds.use-case';
import { RedisBlogPostRepository } from './infrastructure/persistence/redis-blog-post.repository';
import { BlogSourceCatalogService } from './infrastructure/services/blog-source-catalog.service';
import { RssBlogFeedReaderService } from './infrastructure/services/rss-blog-feed-reader.service';
import { BLOG_POST_REPOSITORY } from './application/ports/blog-post.repository';
import { BLOG_SOURCE_CATALOG } from './application/ports/blog-source-catalog';

describe('BlogService', () => {
  let service: BlogService;

  const translationService = {
    translate: jest.fn(),
  };
  const redisService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        BlogPostQueryService,
        BlogFeedCollectorService,
        BlogPostTranslationService,
        GetAllBlogPostsUseCase,
        GetBlogCompaniesUseCase,
        GetCompanyBlogPostsUseCase,
        InitializeBlogFeedsUseCase,
        UpdateBlogFeedsUseCase,
        RedisBlogPostRepository,
        BlogSourceCatalogService,
        RssBlogFeedReaderService,
        {
          provide: BLOG_POST_REPOSITORY,
          useExisting: RedisBlogPostRepository,
        },
        {
          provide: BLOG_SOURCE_CATALOG,
          useExisting: BlogSourceCatalogService,
        },
        { provide: TranslationService, useValue: translationService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<BlogService>(BlogService);
    jest.clearAllMocks();
  });

  it('throws NotFoundException for unsupported companies', async () => {
    await expect(service.getCompanyPosts('UNKNOWN')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
