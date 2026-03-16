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
import { ContentSnapshotHistoryBuilderService } from '../../domain/services/content-snapshot-history-builder.service';
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
    private readonly contentSnapshotHistoryBuilderService: ContentSnapshotHistoryBuilderService,
  ) {}

  async execute(
    query: GetContentTrendsQueryDto,
  ): Promise<ContentTrendsResponseDto> {
    const historyLimit = query.historyPoints ?? 10;
    const trendLimit = query.trendLimit ?? 5;
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
    const history = await this.blogPostRepository.getContentSnapshotHistory(
      historyLimit,
    );
    const effectiveHistory =
      snapshot
        ? this.buildEffectiveHistory(
            posts,
            snapshot,
            history,
            historyLimit,
          )
        : history.slice(0, historyLimit);

    return {
      generatedAt: new Date().toISOString(),
      snapshot,
      summary: {
        totalItems: filteredPosts.length,
        companies: new Set(filteredPosts.map((post) => post.company)).size,
        windowDays: query.days ?? 30,
        totalTopics: trends.length,
        historyPoints: effectiveHistory.length,
      },
      trends,
      history: this.contentSnapshotHistoryBuilderService.buildHistorySection(
        effectiveHistory,
        trendLimit,
      ),
      sources: this.sourceRegistryService
        .list({ context: 'content' })
        .sort((left, right) => left.id.localeCompare(right.id)),
    };
  }

  private buildEffectiveHistory(
    posts: Awaited<ReturnType<BlogPostRepository['getPostsForCompanies']>>,
    snapshot: NonNullable<Awaited<ReturnType<typeof mergeSnapshotMetadata>>>,
    history: Awaited<ReturnType<BlogPostRepository['getContentSnapshotHistory']>>,
    limit: number,
  ) {
    const currentSnapshot = this.contentSnapshotHistoryBuilderService.build(
      posts,
      snapshot,
    );

    if (history[0]?.snapshot.collectedAt === currentSnapshot.snapshot.collectedAt) {
      return history.slice(0, limit);
    }

    return [currentSnapshot, ...history].slice(0, limit);
  }
}
