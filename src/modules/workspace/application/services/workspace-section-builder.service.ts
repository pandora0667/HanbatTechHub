import { Inject, Injectable } from '@nestjs/common';
import {
  createOffsetPaginationWindow,
  toOffsetPaginationMeta,
} from '../../../../common/utils/pagination.util';
import {
  buildSnapshotMetadata,
  mergeSnapshotMetadata,
} from '../../../../common/utils/snapshot.util';
import {
  BLOG_POST_REPOSITORY,
  BlogPostRepository,
} from '../../../blog/application/ports/blog-post.repository';
import {
  BLOG_SOURCE_CATALOG,
  BlogSourceCatalog,
} from '../../../blog/application/ports/blog-source-catalog';
import { BlogResponseDto } from '../../../blog/dto/blog-response.dto';
import { BlogPost } from '../../../blog/interfaces/blog.interface';
import {
  BLOG_SOURCE_CONFIDENCE,
  DEFAULT_REDIS_TTL,
  getBlogSourceId,
} from '../../../blog/constants/blog.constant';
import {
  NOTICE_CACHE_REPOSITORY,
  NoticeCacheRepository,
} from '../../../notice/application/ports/notice-cache.repository';
import {
  NOTICE_CACHE_TTL,
  NOTICE_SOURCE_CONFIDENCE,
  NOTICE_SOURCE_ID,
} from '../../../notice/constants/notice.constant';
import { NoticeListResponseDto } from '../../../notice/dto/notice.dto';
import { NoticeSummary } from '../../../notice/domain/models/notice.model';
import { SourceFreshnessSignalsResponseDto } from '../../../signals/dto/source-freshness-signals.response.dto';

@Injectable()
export class WorkspaceSectionBuilderService {
  constructor(
    @Inject(BLOG_POST_REPOSITORY)
    private readonly blogPostRepository: BlogPostRepository,
    @Inject(BLOG_SOURCE_CATALOG)
    private readonly blogSourceCatalog: BlogSourceCatalog,
    @Inject(NOTICE_CACHE_REPOSITORY)
    private readonly noticeCacheRepository: NoticeCacheRepository,
  ) {}

  async getLatestContent(limit: number): Promise<BlogResponseDto> {
    const companyCodes = this.blogSourceCatalog.listCodes();
    const [posts, snapshots] = await Promise.all([
      this.blogPostRepository.getPostsForCompanies(companyCodes),
      Promise.all(
        companyCodes.map(async (companyCode) => {
          const lastUpdate =
            await this.blogPostRepository.getCompanyLastUpdate(companyCode);

          if (!lastUpdate) {
            return undefined;
          }

          return buildSnapshotMetadata({
            collectedAt: lastUpdate,
            ttlSeconds: DEFAULT_REDIS_TTL,
            confidence: BLOG_SOURCE_CONFIDENCE,
            sourceIds: [getBlogSourceId(companyCode)],
          });
        }),
      ),
    ]);
    const dedupedPosts = this.dedupePosts(posts).sort(
      (left, right) => right.publishDate.getTime() - left.publishDate.getTime(),
    );
    const window = createOffsetPaginationWindow(dedupedPosts.length, 1, limit, limit);

    return {
      items: dedupedPosts.slice(0, window.limit),
      meta: {
        ...toOffsetPaginationMeta(window),
        snapshot: mergeSnapshotMetadata(
          snapshots.filter((snapshot) => snapshot !== undefined),
        ),
      },
    };
  }

  async getLatestNotices(limit: number): Promise<NoticeListResponseDto> {
    const [notices, lastUpdate] = await Promise.all([
      this.noticeCacheRepository.getRegularNotices(),
      this.noticeCacheRepository.getLastUpdate(),
    ]);
    const rankedNotices = (notices ?? [])
      .slice()
      .sort((left, right) => this.compareNotices(left, right));
    const window = createOffsetPaginationWindow(rankedNotices.length, 1, limit, limit);

    return {
      items: rankedNotices.slice(0, window.limit),
      meta: {
        ...toOffsetPaginationMeta(window),
        snapshot: lastUpdate
          ? buildSnapshotMetadata({
              collectedAt: lastUpdate,
              ttlSeconds: NOTICE_CACHE_TTL,
              confidence: NOTICE_SOURCE_CONFIDENCE,
              sourceIds: [NOTICE_SOURCE_ID],
            })
          : undefined,
      },
    };
  }

  limitFreshnessSignals(
    response: SourceFreshnessSignalsResponseDto,
    limit: number,
  ): SourceFreshnessSignalsResponseDto {
    const signals = response.signals.slice(0, limit);

    return {
      generatedAt: response.generatedAt,
      summary: {
        total: signals.length,
        fresh: signals.filter((signal) => signal.status === 'fresh').length,
        stale: signals.filter((signal) => signal.status === 'stale').length,
        missing: signals.filter((signal) => signal.status === 'missing').length,
      },
      signals,
    };
  }

  private dedupePosts(posts: BlogPost[]): BlogPost[] {
    const deduped = new Map<string, BlogPost>();

    for (const post of posts) {
      const key = this.resolvePostKey(post);
      const existing = deduped.get(key);

      if (!existing || post.publishDate.getTime() > existing.publishDate.getTime()) {
        deduped.set(key, post);
      }
    }

    return Array.from(deduped.values());
  }

  private resolvePostKey(post: BlogPost): string {
    return `${post.company}:${post.link || post.title.toLowerCase()}`;
  }

  private compareNotices(left: NoticeSummary, right: NoticeSummary): number {
    const leftScore = this.scoreNotice(left);
    const rightScore = this.scoreNotice(right);

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return this.parseNoticeDate(right.date) - this.parseNoticeDate(left.date);
  }

  private scoreNotice(notice: NoticeSummary): number {
    let score = 0;

    if (notice.isNew) {
      score += 20;
    }

    if (notice.hasAttachment) {
      score += 10;
    }

    return score;
  }

  private parseNoticeDate(value: string): number {
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
}
