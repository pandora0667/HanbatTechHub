import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import { DailyMenu } from '../models/menu.model';

export interface MenuQueryResult {
  menu: DailyMenu;
  snapshot?: SnapshotMetadata;
}

export interface WeeklyMenuQueryResult {
  menus: DailyMenu[];
  snapshot?: SnapshotMetadata;
}
