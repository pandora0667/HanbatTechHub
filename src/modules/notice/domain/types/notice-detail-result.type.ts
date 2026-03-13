import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import { NoticeDetail } from '../models/notice.model';

export interface NoticeDetailResult {
  detail: NoticeDetail;
  snapshot?: SnapshotMetadata;
}
