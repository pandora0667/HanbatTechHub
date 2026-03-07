import { Injectable, Logger } from '@nestjs/common';
import { MenuCalendarService } from './menu-calendar.service';
import { MenuItemDto, MenuResponseDto } from '../../dto/menu.dto';

@Injectable()
export class MenuResponseFactoryService {
  private readonly logger = new Logger(MenuResponseFactoryService.name);

  constructor(private readonly menuCalendarService: MenuCalendarService) {}

  buildMenuForDate(menuData: any[], targetDate: Date): MenuResponseDto {
    const formattedDate = this.menuCalendarService.formatDate(targetDate);
    const dayIndex = this.menuCalendarService.getDayIndex(targetDate);
    const menuItems = this.extractMenuItemsFromData(
      menuData,
      formattedDate,
      dayIndex,
    );

    return this.formatMenuResponse(menuItems, formattedDate);
  }

  buildWeeklyMenus(menuData: any[], mondayDate: Date): MenuResponseDto[] {
    const weekMenus: MenuResponseDto[] = [];

    for (let i = 0; i < 5; i++) {
      const targetDate = new Date(mondayDate);
      targetDate.setDate(mondayDate.getDate() + i);
      const formattedDate = this.menuCalendarService.formatDate(targetDate);
      const menuItems = this.extractMenuItemsFromData(
        menuData,
        formattedDate,
        i,
      );

      weekMenus.push(this.formatMenuResponse(menuItems, formattedDate));
    }

    for (let i = 5; i < 7; i++) {
      const targetDate = new Date(mondayDate);
      targetDate.setDate(mondayDate.getDate() + i);
      const formattedDate = this.menuCalendarService.formatDate(targetDate);

      weekMenus.push({
        date: formattedDate,
        lunch: [],
        dinner: [],
      });
    }

    return weekMenus;
  }

  private extractMenuItemsFromData(
    menuData: any[],
    date: string,
    dayIndex: number,
  ): MenuItemDto[] {
    const menuItems: MenuItemDto[] = [];

    if (!menuData || menuData.length === 0 || dayIndex < 0 || dayIndex > 4) {
      this.logger.warn(`${date} 날짜의 메뉴 데이터가 없거나 주말입니다.`);
      return menuItems;
    }

    try {
      const menuKey = `menu${dayIndex + 1}`;

      const lunchData = menuData.find((item) => item.type === 'B');
      if (lunchData && lunchData[menuKey]) {
        const lunchMenuItems = this.parseMenuText(lunchData[menuKey]);

        if (lunchMenuItems.length > 0) {
          menuItems.push({
            date,
            meal: 'lunch',
            menu: lunchMenuItems,
          });
        }
      }

      const dinnerData = menuData.find((item) => item.type === 'C');
      if (dinnerData && dinnerData[menuKey]) {
        const dinnerMenuItems = this.parseMenuText(dinnerData[menuKey]);

        if (dinnerMenuItems.length > 0) {
          menuItems.push({
            date,
            meal: 'dinner',
            menu: dinnerMenuItems,
          });
        }
      }

      return menuItems;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`메뉴 아이템 추출 실패: ${errorMessage}`);
      return [];
    }
  }

  private parseMenuText(menuText: string): string[] {
    if (!menuText) {
      return [];
    }

    const cleanText = menuText
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&quot;/g, '"')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/<br>/gi, '\n')
      .replace(/<[^>]*>/g, '');

    return cleanText
      .split(/\r\n|\n|\r/)
      .map((item) => item.trim())
      .filter((item) => item && item !== '-');
  }

  private formatMenuResponse(
    menuItems: MenuItemDto[],
    date: string,
  ): MenuResponseDto {
    const lunchMenu =
      menuItems.find((item) => item.meal === 'lunch')?.menu || [];
    const dinnerMenu =
      menuItems.find((item) => item.meal === 'dinner')?.menu || [];

    return {
      date,
      lunch: lunchMenu,
      dinner: dinnerMenu,
    };
  }
}
