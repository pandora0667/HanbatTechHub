import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BlogService } from './blog.service';
import { TranslationService } from '../translation/services/translation.service';
import { RedisService } from '../redis/redis.service';

describe('BlogService', () => {
  let service: BlogService;
  const translationService = {
    translate: jest.fn(),
  };
  const redisService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        { provide: TranslationService, useValue: translationService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<BlogService>(BlogService);
    jest.clearAllMocks();
  });

  it('preserves translated posts when feed content has not changed', async () => {
    redisService.get.mockResolvedValue([
      {
        id: 'post-1',
        company: '토스',
        title: '번역된 제목',
        description: '번역된 설명',
        originalTitle: 'Original Title',
        originalDescription: 'Original Description',
        link: 'https://example.com/post-1',
        publishDate: '2025-01-01T00:00:00.000Z',
        isTranslated: true,
      },
    ]);
    (service as any).parser = {
      parseURL: jest.fn().mockResolvedValue({
        items: [
          {
            guid: 'post-1',
            title: 'Original Title',
            description: 'Original Description',
            link: 'https://example.com/post-1',
            pubDate: '2025-01-01T00:00:00.000Z',
          },
        ],
      }),
    };

    await (service as any).collectFeeds(['TOSS']);

    expect(redisService.set).toHaveBeenCalledWith(
      'hbnu:blog:company:TOSS',
      expect.arrayContaining([
        expect.objectContaining({
          id: 'post-1',
          title: '번역된 제목',
          description: '번역된 설명',
          isTranslated: true,
        }),
      ]),
      expect.any(Number),
    );
  });

  it('throws NotFoundException for unsupported companies', async () => {
    await expect(service.getCompanyPosts('UNKNOWN')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
