import { Controller, Get, Param, Logger } from '@nestjs/common';
import { NoticeService } from './notice.service';
import {
  NoticeListResponseDto,
  NoticeDetailResponseDto,
} from './dto/notice.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Notices')
@Controller('notices')
export class NoticeController {
  private readonly logger = new Logger(NoticeController.name);

  constructor(private readonly noticeService: NoticeService) {}

  @Get()
  @ApiOperation({ summary: '일반 공지사항 목록 조회' })
  async getNotices(): Promise<NoticeListResponseDto> {
    return this.noticeService.getNotices();
  }

  @Get('new')
  @ApiOperation({ summary: '새로운 공지사항 목록 조회' })
  async getNewNotices(): Promise<NoticeListResponseDto> {
    return this.noticeService.getNewNotices();
  }

  @Get('featured')
  @ApiOperation({ summary: '고정 공지사항 목록 조회' })
  async getFeaturedNotices(): Promise<NoticeListResponseDto> {
    return this.noticeService.getFeaturedNotices();
  }

  @Get('today')
  @ApiOperation({ summary: '오늘 등록된 공지사항 목록 조회' })
  async getTodayNotices(): Promise<NoticeListResponseDto> {
    return this.noticeService.getTodayNotices();
  }

  @Get(':id')
  @ApiOperation({ summary: '공지사항 상세 정보 조회' })
  async getNoticeDetail(
    @Param('id') id: string,
  ): Promise<NoticeDetailResponseDto> {
    return this.noticeService.getNoticeDetail(id);
  }
}
