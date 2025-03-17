export interface BlogPost {
  id: string;
  company: string;
  title: string;
  description: string;
  link: string;
  author?: string;
  publishDate: Date;
  isTranslated: boolean;
}

export interface BlogPostCache {
  lastUpdate: Date;
  posts: BlogPost[];
}

export interface CompanyInfo {
  name: string;
  url: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password: string;
  db: number;
  ttl: number;
}

export interface RedisBlogPost extends Omit<BlogPost, 'publishDate'> {
  publishDate: string; // Date를 ISO string으로 저장
}
