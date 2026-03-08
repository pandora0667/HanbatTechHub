import { Injectable } from '@nestjs/common';
import { formatDate } from '../../../../common/utils/date.utils';

@Injectable()
export class MenuCalendarService {
  getMondayDate(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();

    if (day === 0) {
      result.setDate(result.getDate() + 1);
    } else {
      result.setDate(result.getDate() - (day - 1));
    }

    return result;
  }

  getDayIndex(date: Date): number {
    const day = date.getDay();
    return day === 0 || day === 6 ? -1 : day - 1;
  }

  formatDate(date: Date): string {
    return formatDate(date);
  }
}
