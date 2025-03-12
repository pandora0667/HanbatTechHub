import { Controller, Get, Param, Logger } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { NoticeResponseDto, NoticeDetailResponseDto } from './dto/notice.dto';

@Controller('notices')
export class NoticeController {
  private readonly logger = new Logger(NoticeController.name);

  constructor(private readonly noticeService: NoticeService) {}

  /**
   * 공지사항 목록을 가져옵니다.
   */
  @Get()
  async getNoticeList(): Promise<NoticeResponseDto> {
    this.logger.log(`공지사항 목록 요청: 페이지=1, 검색 비활성화`);
    return this.noticeService.getRegularNoticeList(1, 'all', '');
  }

  /**
   * 새로운 공지사항 목록을 가져옵니다. (isNew: true)
   */
  @Get('new')
  async getNewNoticeList(): Promise<NoticeResponseDto> {
    this.logger.log(`새로운 공지사항 목록 요청: 페이지=1, 검색 비활성화`);
    return this.noticeService.getNewNoticeList(1, 'all', '');
  }

  /**
   * 고정 공지사항 목록을 가져옵니다. (no: "공지")
   */
  @Get('featured')
  async getFeaturedNoticeList(): Promise<NoticeResponseDto> {
    this.logger.log(`고정 공지사항 목록 요청: 페이지=1, 검색 비활성화`);
    return this.noticeService.getFeaturedNoticeList(1, 'all', '');
  }

  /**
   * 오늘 등록된 공지사항 목록을 가져옵니다.
   */
  @Get('today')
  async getTodayNoticeList(): Promise<NoticeResponseDto> {
    this.logger.log(`오늘 공지사항 목록 요청: 페이지=1, 검색 비활성화`);
    return this.noticeService.getTodayNoticeList(1, 'all', '');
  }

  /**
   * 공지사항 상세 정보를 가져옵니다.
   * @param nttId 게시글 ID
   */
  @Get(':id')
  async getNoticeDetail(
    @Param('id') nttId: string,
  ): Promise<NoticeDetailResponseDto> {
    this.logger.log(`공지사항 상세 요청: ID=${nttId}`);
    return this.noticeService.getNoticeDetail(nttId);
  }
}
