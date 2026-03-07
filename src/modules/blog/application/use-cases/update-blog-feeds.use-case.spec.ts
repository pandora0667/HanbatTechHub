import { Test, TestingModule } from '@nestjs/testing';
import { BlogFeedCollectorService } from '../services/blog-feed-collector.service';
import { BlogPostTranslationService } from '../services/blog-post-translation.service';
import { UpdateBlogFeedsUseCase } from './update-blog-feeds.use-case';

describe('UpdateBlogFeedsUseCase', () => {
  let useCase: UpdateBlogFeedsUseCase;

  const blogFeedCollectorService = {
    collectFeeds: jest.fn(),
  };
  const blogPostTranslationService = {
    translatePendingPosts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateBlogFeedsUseCase,
        {
          provide: BlogFeedCollectorService,
          useValue: blogFeedCollectorService,
        },
        {
          provide: BlogPostTranslationService,
          useValue: blogPostTranslationService,
        },
      ],
    }).compile();

    useCase = module.get(UpdateBlogFeedsUseCase);
    jest.clearAllMocks();
  });

  it('collects feeds before translating pending posts', async () => {
    await useCase.execute();

    expect(blogFeedCollectorService.collectFeeds).toHaveBeenCalledTimes(1);
    expect(blogPostTranslationService.translatePendingPosts).toHaveBeenCalledTimes(
      1,
    );
    expect(
      blogFeedCollectorService.collectFeeds.mock.invocationCallOrder[0],
    ).toBeLessThan(
      blogPostTranslationService.translatePendingPosts.mock
        .invocationCallOrder[0],
    );
  });
});
