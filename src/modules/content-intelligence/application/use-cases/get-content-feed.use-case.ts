import { Inject, Injectable } from '@nestjs/common';
import { paginateArray } from '../../../../common/utils/pagination.util';
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
import { GetContentFeedQueryDto } from '../../dto/get-content-feed-query.dto';
import { ContentFeedResponseDto } from '../../dto/content-intelligence.response.dto';

@Injectable()
export class GetContentFeedUseCase {
  constructor(
    @Inject(BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: BlogPostRepository,
    @Inject(BLOG_SOURCE_CATALOG)
    private readonly blogSourceCatalog: BlogSourceCatalog,
    private readonly sourceRegistryService: SourceRegistryService,
  ) {}

  async execute(query: GetContentFeedQueryDto): Promise<ContentFeedResponseDto> {
    const companies = query.company
      ? [query.company]
      : this.blogSourceCatalog.listCodes();
    const posts = await this.blogPostRepository.getPostsForCompanies(companies);
    const filteredPosts = posts
      .filter((post) =>
        query.keyword
          ? `${post.title} ${post.description}`
              .toLowerCase()
              .includes(query.keyword.toLowerCase())
          : true,
      )
      .sort(
        (left, right) =>
          right.publishDate.getTime() - left.publishDate.getTime(),
      );
    const paginated = paginateArray(
      filteredPosts,
      query.page ?? 1,
      query.limit ?? 20,
      20,
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
      summary: {
        totalItems: filteredPosts.length,
        companies: new Set(filteredPosts.map((post) => post.company)).size,
        filtered: Boolean(query.company || query.keyword),
      },
      meta: {
        ...paginated.meta,
        limit: query.limit ?? 20,
        company: query.company,
        keyword: query.keyword,
        snapshot,
      },
      items: paginated.items.map((post) => ({
        id: post.id,
        company: post.company,
        title: post.title,
        description: post.description,
        link: post.link,
        author: post.author,
        publishDate: post.publishDate.toISOString(),
      })),
      sources: this.sourceRegistryService
        .list({ context: 'content' })
        .filter((source) => companies.includes(source.id.replace('content.blog.', '').toUpperCase()) || companies.includes(source.id.replace('content.blog.', '')) || companies.includes(this.restoreCode(source.id)))
        .sort((left, right) => left.id.localeCompare(right.id)),
    };
  }

  private restoreCode(sourceId: string): string {
    const raw = sourceId.replace('content.blog.', '');
    return raw.toUpperCase();
  }
}
