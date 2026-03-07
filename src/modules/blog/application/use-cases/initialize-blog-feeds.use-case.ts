import { Injectable } from '@nestjs/common';
import { BlogFeedCollectorService } from '../services/blog-feed-collector.service';

@Injectable()
export class InitializeBlogFeedsUseCase {
  constructor(
    private readonly blogFeedCollectorService: BlogFeedCollectorService,
  ) {}

  async execute(): Promise<void> {
    await this.blogFeedCollectorService.collectFeeds();
  }
}
