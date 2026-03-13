import { Injectable } from '@nestjs/common';
import { BlogPost } from '../../../blog/interfaces/blog.interface';

interface TopicStat {
  mentions: number;
  companies: Set<string>;
  sampleTitles: string[];
}

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'that',
  'this',
  'into',
  'using',
  'your',
  'about',
  'what',
  'when',
  'where',
  'why',
  'how',
  'tech',
  'engineering',
  'developer',
  'developers',
  'blog',
]);

@Injectable()
export class ContentTopicExtractorService {
  extract(posts: BlogPost[], minMentions: number, limit: number) {
    const stats = new Map<string, TopicStat>();

    for (const post of posts) {
      const tokens = this.extractTokens(`${post.title} ${post.description}`);

      for (const token of tokens) {
        const current = stats.get(token) ?? {
          mentions: 0,
          companies: new Set<string>(),
          sampleTitles: [],
        };

        current.mentions += 1;
        current.companies.add(post.company);

        if (current.sampleTitles.length < 3) {
          current.sampleTitles.push(post.title);
        }

        stats.set(token, current);
      }
    }

    return Array.from(stats.entries())
      .map(([topic, stat]) => ({
        topic,
        mentions: stat.mentions,
        companies: stat.companies.size,
        sampleTitles: stat.sampleTitles,
      }))
      .filter((topic) => topic.mentions >= minMentions)
      .sort((left, right) => {
        if (right.mentions !== left.mentions) {
          return right.mentions - left.mentions;
        }

        return right.companies - left.companies;
      })
      .slice(0, limit);
  }

  private extractTokens(text: string): string[] {
    return Array.from(
      new Set(
        text
          .toLowerCase()
          .replace(/[^a-z0-9+#.\- ]/g, ' ')
          .split(/\s+/)
          .map((token) => token.trim())
          .filter(
            (token) =>
              token.length >= 3 &&
              !STOPWORDS.has(token) &&
              !/^\d+$/.test(token),
          ),
      ),
    );
  }
}
