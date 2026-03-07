import { Inject, Injectable } from '@nestjs/common';
import { MenuCalendarService } from '../../domain/services/menu-calendar.service';
import { MenuResponseFactoryService } from '../../domain/services/menu-response-factory.service';
import {
  MENU_SOURCE_GATEWAY,
  MenuSourceGateway,
} from '../ports/menu-source.gateway';
import { MenuResponseDto } from '../../dto/menu.dto';

@Injectable()
export class MenuLoaderService {
  constructor(
    @Inject(MENU_SOURCE_GATEWAY)
    private readonly menuSourceGateway: MenuSourceGateway,
    private readonly menuCalendarService: MenuCalendarService,
    private readonly menuResponseFactoryService: MenuResponseFactoryService,
  ) {}

  async loadMenuByDate(
    date?: string,
  ): Promise<{ date: string; menu: MenuResponseDto }> {
    const targetDate = date ? new Date(date) : new Date();
    const mondayDate = this.menuCalendarService.getMondayDate(targetDate);
    const formattedMondayDate = this.menuCalendarService.formatDate(mondayDate);
    const menuData = await this.menuSourceGateway.fetchMenuData(formattedMondayDate);

    return {
      date: this.menuCalendarService.formatDate(targetDate),
      menu: this.menuResponseFactoryService.buildMenuForDate(menuData, targetDate),
    };
  }

  async loadWeeklyMenu(
    startDate?: string,
  ): Promise<{ mondayDate: string; menus: MenuResponseDto[] }> {
    const startDay = startDate ? new Date(startDate) : new Date();
    const mondayDate = this.menuCalendarService.getMondayDate(startDay);
    const formattedMondayDate = this.menuCalendarService.formatDate(mondayDate);
    const menuData = await this.menuSourceGateway.fetchMenuData(formattedMondayDate);

    return {
      mondayDate: formattedMondayDate,
      menus: this.menuResponseFactoryService.buildWeeklyMenus(menuData, mondayDate),
    };
  }
}
