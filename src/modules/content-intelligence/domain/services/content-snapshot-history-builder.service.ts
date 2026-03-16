import { Injectable } from '@nestjs/common';
import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import {
  BLOG_CONTENT_HISTORY_TOPIC_LIMIT,
  BLOG_CONTENT_HISTORY_WINDOW_DAYS,
} from '../../../blog/constants/blog.constant';
import { BlogPost } from '../../../blog/interfaces/blog.interface';
import { ContentSnapshotHistoryEntry } from '../models/content-snapshot-history.model';
import { ContentTopicExtractorService } from './content-topic-extractor.service';

@Injectable()
export class ContentSnapshotHistoryBuilderService {
  constructor(
    private readonly contentTopicExtractorService: ContentTopicExtractorService,
  ) {}

  build(
    posts: BlogPost[],
    snapshot: SnapshotMetadata,
    options?: {
      windowDays?: number;
      topicLimit?: number;
    },
  ): ContentSnapshotHistoryEntry {
    const windowDays = options?.windowDays ?? BLOG_CONTENT_HISTORY_WINDOW_DAYS;
    const topicLimit = options?.topicLimit ?? BLOG_CONTENT_HISTORY_TOPIC_LIMIT;
    const windowStart = new Date(snapshot.collectedAt);
    windowStart.setDate(windowStart.getDate() - windowDays);

    const recentPosts = posts.filter(
      (post) => post.publishDate.getTime() >= windowStart.getTime(),
    );
    const topics = this.contentTopicExtractorService.extract(
      recentPosts,
      1,
      topicLimit,
    );
    const companies = Array.from(
      recentPosts.reduce((stats, post) => {
        stats.set(post.company, (stats.get(post.company) ?? 0) + 1);
        return stats;
      }, new Map<string, number>()),
    )
      .map(([company, items]) => ({ company, items }))
      .sort((left, right) => {
        if (right.items !== left.items) {
          return right.items - left.items;
        }

        return left.company.localeCompare(right.company);
      });

    return {
      snapshot,
      summary: {
        totalItems: recentPosts.length,
        companies: companies.length,
        topicsTracked: topics.length,
        windowDays,
      },
      companies,
      topics: topics.map((topic) => ({
        topic: topic.topic,
        mentions: topic.mentions,
        companies: topic.companies,
      })),
    };
  }

  buildHistorySection(
    history: ContentSnapshotHistoryEntry[],
    limit: number,
  ) {
    if (history.length === 0) {
      return {
        summary: {
          historyPoints: 0,
          windowDays: BLOG_CONTENT_HISTORY_WINDOW_DAYS,
          baselineCollectedAt: undefined,
          latestCollectedAt: undefined,
          totalItemsDelta: 0,
          topicsTrackedDelta: 0,
        },
        timeline: [],
        companyMomentum: [],
        topicMomentum: [],
      };
    }

    const latest = history[0];
    const baseline = history[history.length - 1];

    return {
      summary: {
        historyPoints: history.length,
        windowDays: latest.summary.windowDays,
        baselineCollectedAt: baseline.snapshot.collectedAt,
        latestCollectedAt: latest.snapshot.collectedAt,
        totalItemsDelta: latest.summary.totalItems - baseline.summary.totalItems,
        topicsTrackedDelta:
          latest.summary.topicsTracked - baseline.summary.topicsTracked,
      },
      timeline: [...history]
        .reverse()
        .map((entry) => ({
          collectedAt: entry.snapshot.collectedAt,
          totalItems: entry.summary.totalItems,
          companies: entry.summary.companies,
          topicsTracked: entry.summary.topicsTracked,
        })),
      companyMomentum: this.buildMomentum(
        latest.companies.map((item) => ({
          key: item.company,
          label: item.company,
          count: item.items,
        })),
        baseline.companies.map((item) => ({
          key: item.company,
          label: item.company,
          count: item.items,
        })),
        limit,
      ),
      topicMomentum: this.buildMomentum(
        latest.topics.map((item) => ({
          key: item.topic,
          label: item.topic,
          count: item.mentions,
        })),
        baseline.topics.map((item) => ({
          key: item.topic,
          label: item.topic,
          count: item.mentions,
        })),
        limit,
      ),
    };
  }

  private buildMomentum(
    currentItems: Array<{ key: string; label: string; count: number }>,
    baselineItems: Array<{ key: string; label: string; count: number }>,
    limit: number,
  ) {
    const baselineMap = new Map(
      baselineItems.map((item) => [item.key, item.count] as const),
    );

    return currentItems
      .map((item) => {
        const baselineCount = baselineMap.get(item.key) ?? 0;
        const delta = item.count - baselineCount;

        return {
          name: item.label,
          currentCount: item.count,
          baselineCount,
          delta,
          direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
        } as const;
      })
      .sort((left, right) => {
        const rightMagnitude = Math.abs(right.delta);
        const leftMagnitude = Math.abs(left.delta);

        if (rightMagnitude !== leftMagnitude) {
          return rightMagnitude - leftMagnitude;
        }

        if (right.currentCount !== left.currentCount) {
          return right.currentCount - left.currentCount;
        }

        return left.name.localeCompare(right.name);
      })
      .slice(0, limit);
  }
}
