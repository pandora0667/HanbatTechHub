import { Injectable } from '@nestjs/common';
import { DailyMenu } from '../../domain/models/menu.model';
import { MenuResponseDto } from '../../dto/menu.dto';

@Injectable()
export class MenuResponseMapper {
  toResponse(menu: DailyMenu): MenuResponseDto {
    return {
      date: menu.date,
      lunch: [...menu.lunch],
      dinner: [...menu.dinner],
    };
  }

  toResponseList(menus: DailyMenu[]): MenuResponseDto[] {
    return menus.map((menu) => this.toResponse(menu));
  }
}
