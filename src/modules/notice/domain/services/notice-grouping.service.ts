import { Injectable } from '@nestjs/common';
import { isToday } from '../../../../common/utils/date.utils';
import { NoticeGroups, NoticeSummary } from '../models/notice.model';

@Injectable()
export class NoticeGroupingService {
  classify(notices: NoticeSummary[]): NoticeGroups {
    return {
      regular: notices.filter((notice) => notice.no !== '공지'),
      featured: notices.filter((notice) => notice.no === '공지'),
      new: notices.filter((notice) => notice.isNew),
      today: this.filterTodayNotices(notices),
    };
  }

  private filterTodayNotices(notices: NoticeSummary[]): NoticeSummary[] {
    return notices.filter(
      (notice) => isToday(notice.date) && notice.no !== '공지',
    );
  }
}
