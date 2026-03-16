import { BlogPost } from '../../interfaces/blog.interface';
import { ContentSnapshotHistoryEntry } from '../../../content-intelligence/domain/models/content-snapshot-history.model';

export const BLOG_POST_REPOSITORY = 'BLOG_POST_REPOSITORY';

export interface BlogPostRepository {
  getCompanyPosts(company: string): Promise<BlogPost[]>;
  getPostsForCompanies(companies: string[]): Promise<BlogPost[]>;
  saveCompanyPosts(company: string, posts: BlogPost[]): Promise<void>;
  getCompanyLastUpdate(company: string): Promise<string | null>;
  setCompanyLastUpdate(company: string, timestamp: string): Promise<void>;
  getContentSnapshotHistory(limit?: number): Promise<ContentSnapshotHistoryEntry[]>;
  appendContentSnapshotHistory(entry: ContentSnapshotHistoryEntry): Promise<void>;
}
