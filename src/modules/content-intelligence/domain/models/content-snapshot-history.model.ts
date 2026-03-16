import { SnapshotMetadata } from '../../../../common/types/snapshot.types';

export interface ContentSnapshotHistorySummary {
  totalItems: number;
  companies: number;
  topicsTracked: number;
  windowDays: number;
}

export interface ContentSnapshotHistoryCompanyItem {
  company: string;
  items: number;
}

export interface ContentSnapshotHistoryTopicItem {
  topic: string;
  mentions: number;
  companies: number;
}

export interface ContentSnapshotHistoryEntry {
  snapshot: SnapshotMetadata;
  summary: ContentSnapshotHistorySummary;
  companies: ContentSnapshotHistoryCompanyItem[];
  topics: ContentSnapshotHistoryTopicItem[];
}
