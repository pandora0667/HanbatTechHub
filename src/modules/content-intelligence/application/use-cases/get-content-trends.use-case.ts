import { Inject, Injectable } from '@nestjs/common';
import { buildSnapshotMetadata, mergeSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import {
  BLOG_POST_REPOSITORY,
  BlogPostRepository,
} from '../../../blog/application/ports/blog-post.repository';
import {
  BLOG_SOURCE_CATALOG,
  BlogSourceCatalog,
} from '../../../blog/application/ports/blog-source-catalog';
import {
  BLOG_SOURCE_CONFIDENCE,
  DEFAULT_REDIS_TTL,
  getBlogSourceId,
} from '../../../blog/constants/blog.constant';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { GetContentTrendsQueryDto } from '../../dto/get-content-trends-query.dto';
import { ContentTrendsResponseDto } from '../../dto/content-intelligence.response.dto';
import { ContentTopicExtractorService } from '../../domain/services/content-topic-extractor.service';

@Injectable()
export class GetContentTrendsUseCase {
  constructor(
    @Inject(BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: BlogPostRepository,
    @Inject(BLOG_SOURCE_CATALOG)
    private readonly blogSourceCatalog: BlogSourceCatalog,
    private readonly sourceRegistryService: SourceRegistryService,
    private readonly contentTopicExtractorService: ContentTopicExtractorService,
  ) {}

  async execute(
    query: GetContentTrendsQueryDto,
  ): Promise<ContentTrendsResponseDto> {
    const companies = this.blogSourceCatalog.listCodes();
    const posts = await this.blogPostRepository.getPostsForCompanies(companies);
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - (query.days ?? 30));
    const filteredPosts = posts.filter(
      (post) => post.publishDate.getTime() >= windowStart.getTime(),
    );
    const trends = this.contentTopicExtractorService.extract(
      filteredPosts,
      query.minMentions ?? 2,
      query.limit ?? 10,
    );
    const snapshots = await Promise.all(
      companies.map(async (company) => {
        const lastUpdate = await this.blogPostRepository.getCompanyLastUpdate(company);

        if (!lastUpdate) {
          return undefined;
        }

        return buildSnapshotMetadata({
          collectedAt: lastUpdate,
          ttlSeconds: DEFAULT_REDIS_TTL,
          confidence: BLOG_SOURCE_CONFIDENCE,
          sourceIds: [getBlogSourceId(company)],
        });
      }),
    );
    const snapshot = mergeSnapshotMetadata(
      snapshots.filter((entry) => entry !== undefined),
    );

    return {
      generatedAt: new Date().toISOString(),
      snapshot,
      summary: {
        totalItems: filteredPosts.length,
        companies: new Set(filteredPosts.map((post) => post.company)).size,
        windowDays: query.days ?? 30,
        totalTopics: trends.length,
      },
      trends,
      sources: this.sourceRegistryService
        .list({ context: 'content' })
        .sort((left, right) => left.id.localeCompare(right.id)),
    };
  }
}
