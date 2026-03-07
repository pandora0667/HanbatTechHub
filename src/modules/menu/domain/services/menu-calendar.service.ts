import { Injectable } from '@nestjs/common';

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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
