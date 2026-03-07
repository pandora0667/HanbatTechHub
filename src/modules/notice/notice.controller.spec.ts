import { Test, TestingModule } from '@nestjs/testing';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';

describe('NoticeController', () => {
  let controller: NoticeController;
  const noticeService = {
    getNotices: jest.fn(),
    getNewNotices: jest.fn(),
    getFeaturedNotices: jest.fn(),
    getTodayNotices: jest.fn(),
    getNoticeDetail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoticeController],
      providers: [{ provide: NoticeService, useValue: noticeService }],
    }).compile();

    controller = module.get<NoticeController>(NoticeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
