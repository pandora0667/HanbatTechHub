import { IsDateString, IsOptional } from 'class-validator';

export class MenuRequestDto {
  @IsOptional()
  @IsDateString()
  date?: string; // YYYY-MM-DD 형태
}

export class MenuItemDto {
  date: string;
  meal: string; // 'lunch' 또는 'dinner'
  menu: string[];
}

export class MenuResponseDto {
  date: string;
  lunch: string[];
  dinner: string[];
}

export class MenuListResponseDto {
  menus: MenuResponseDto[];
}
