import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { TranslationModule } from '../translation/translation.module';
import { RedisModule } from '../redis/redis.module';
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

@Module({
  imports: [TranslationModule, RedisModule],
  controllers: [BlogController],
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
  ],
})
export class BlogModule {}
