import { Injectable } from '@nestjs/common';
import { NoticeItemDto } from '../../dto/notice.dto';

@Injectable()
export class NoticeGroupingService {
  classify(notices: NoticeItemDto[]): {
    regular: NoticeItemDto[];
    featured: NoticeItemDto[];
    new: NoticeItemDto[];
    today: NoticeItemDto[];
  } {
    return {
      regular: notices.filter((notice) => notice.no !== '공지'),
      featured: notices.filter((notice) => notice.no === '공지'),
      new: notices.filter((notice) => notice.isNew),
      today: this.filterTodayNotices(notices),
    };
  }

  private filterTodayNotices(notices: NoticeItemDto[]): NoticeItemDto[] {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;

    return notices.filter(
      (notice) => notice.date === todayString && notice.no !== '공지',
    );
  }
}
