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
