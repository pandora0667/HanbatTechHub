import { RssBlogFeedReaderService } from './rss-blog-feed-reader.service';

describe('RssBlogFeedReaderService', () => {
  it('preserves translated posts when feed content has not changed', async () => {
    const service = new RssBlogFeedReaderService();

    (service as any).parser = {
      parseString: jest.fn().mockResolvedValue({
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
    jest
      .spyOn(service as any, 'fetchFeedXml')
      .mockResolvedValue('<rss><channel></channel></rss>');

    const posts = await service.read(
      {
        code: 'TOSS',
        name: '토스',
        url: 'https://example.com/rss.xml',
      },
      [
        {
          id: 'post-1',
          company: '토스',
          title: '번역된 제목',
          description: '번역된 설명',
          originalTitle: 'Original Title',
          originalDescription: 'Original Description',
          link: 'https://example.com/post-1',
          publishDate: new Date('2025-01-01T00:00:00.000Z'),
          isTranslated: true,
        },
      ],
    );

    expect(posts).toEqual([
      expect.objectContaining({
        id: 'post-1',
        title: '번역된 제목',
        description: '번역된 설명',
        isTranslated: true,
      }),
    ]);
    expect((service as any).parser.parseString).toHaveBeenCalledWith(
      '<rss><channel></channel></rss>',
    );
  });
});
