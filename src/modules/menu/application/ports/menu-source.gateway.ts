export const MENU_SOURCE_GATEWAY = 'MENU_SOURCE_GATEWAY';

export interface MenuSourceGateway {
  fetchMenuData(mondayDate: string): Promise<any[]>;
}
