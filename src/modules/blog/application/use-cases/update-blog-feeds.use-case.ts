import { Injectable } from '@nestjs/common';
import { BlogFeedCollectorService } from '../services/blog-feed-collector.service';
import { BlogPostTranslationService } from '../services/blog-post-translation.service';

@Injectable()
export class UpdateBlogFeedsUseCase {
  constructor(
    private readonly blogFeedCollectorService: BlogFeedCollectorService,
    private readonly blogPostTranslationService: BlogPostTranslationService,
  ) {}

  async execute(): Promise<void> {
    await this.blogFeedCollectorService.collectFeeds();
    await this.blogPostTranslationService.translatePendingPosts();
  }
}
