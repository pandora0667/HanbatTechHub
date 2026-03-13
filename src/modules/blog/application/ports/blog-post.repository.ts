import { BlogPost } from '../../interfaces/blog.interface';

export const BLOG_POST_REPOSITORY = 'BLOG_POST_REPOSITORY';

export interface BlogPostRepository {
  getCompanyPosts(company: string): Promise<BlogPost[]>;
  getPostsForCompanies(companies: string[]): Promise<BlogPost[]>;
  saveCompanyPosts(company: string, posts: BlogPost[]): Promise<void>;
  getCompanyLastUpdate(company: string): Promise<string | null>;
  setCompanyLastUpdate(company: string, timestamp: string): Promise<void>;
}
