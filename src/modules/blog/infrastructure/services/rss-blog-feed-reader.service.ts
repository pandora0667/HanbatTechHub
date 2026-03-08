import { Injectable, Logger } from '@nestjs/common';
import * as Parser from 'rss-parser';
import { BlogPost } from '../../interfaces/blog.interface';
import { BlogSourceDefinition } from '../../application/ports/blog-source-catalog';
import { RssFeedItem } from '../models/rss-feed-item.model';

const DEFAULT_PARSER_OPTIONS: Parser.ParserOptions<
  Record<string, unknown>,
  RssFeedItem
> = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (compatible; HanbatTechHub/1.0; +https://github.com/pandora0667/HanbatTechHub)',
    Accept:
      'application/rss+xml, application/xml, application/atom+xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['dc:creator', 'creator'],
      ['content:encoded', 'content'],
      ['atom:updated', 'updated'],
      ['slash:comments', 'comments'],
      ['wfw:commentRss', 'commentRss'],
      ['category', 'categories'],
    ],
  },
};

@Injectable()
export class RssBlogFeedReaderService {
  private readonly logger = new Logger(RssBlogFeedReaderService.name);
  private readonly parser: Parser<Record<string, unknown>, RssFeedItem>;

  constructor() {
    this.parser = new Parser(DEFAULT_PARSER_OPTIONS);
  }

  async read(
    source: BlogSourceDefinition,
    existingPosts: BlogPost[],
  ): Promise<BlogPost[]> {
    const existingPostMap = new Map(
      existingPosts.map((post) => [post.id, post]),
    );
    const parser = this.resolveParser(source);
    const feed = await parser.parseURL(source.url);
    this.logger.debug(
      `Fetched ${source.name} feed: ${feed.items.length} items`,
    );

    const posts: BlogPost[] = [];

    for (const item of feed.items) {
      const feedItem = item as RssFeedItem;

      if (!item.title || !(item.link || item.guid)) {
        continue;
      }

      const sourceTitle = item.title.trim();
      const sourceDescription = this.extractDescription(feedItem);
      const id = item.guid || item.link || '';
      const publishDate = new Date(
        item.pubDate || item.isoDate || feedItem.updated || Date.now(),
      );
      const existingPost = existingPostMap.get(id);
      const canReuseExistingPost = Boolean(
        existingPost &&
          existingPost.originalTitle === sourceTitle &&
          existingPost.originalDescription === sourceDescription,
      );

      posts.push({
        id,
        company: source.name,
        title:
          canReuseExistingPost && existingPost
            ? existingPost.title
            : sourceTitle,
        description:
          canReuseExistingPost && existingPost
            ? existingPost.description
            : sourceDescription,
        originalTitle: sourceTitle,
        originalDescription: sourceDescription,
        link: item.link || item.guid || '',
        author:
          feedItem.creator ||
          item.author ||
          feedItem['dc:creator'] ||
          undefined,
        publishDate,
        isTranslated:
          canReuseExistingPost && existingPost
            ? existingPost.isTranslated
            : false,
      });
    }

    return posts;
  }

  private extractDescription(item: RssFeedItem): string {
    if (!item.description) {
      return item.contentSnippet || '';
    }

    return item.description
      .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
      .replace(/<[^>]*>/g, '')
      .replace(/\[…\]|\[\.{3}\]|\[\.\.\.\]/g, '')
      .trim();
  }

  private resolveParser(
    source: BlogSourceDefinition,
  ): Parser<Record<string, unknown>, RssFeedItem> {
    if (!source.headers && !source.requestOptions) {
      return this.parser;
    }

    return new Parser({
      ...DEFAULT_PARSER_OPTIONS,
      headers: {
        ...DEFAULT_PARSER_OPTIONS.headers,
        ...source.headers,
      },
      requestOptions: source.requestOptions,
    });
  }
}
