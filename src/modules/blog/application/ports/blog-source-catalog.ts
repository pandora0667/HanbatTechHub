export const BLOG_SOURCE_CATALOG = 'BLOG_SOURCE_CATALOG';

export interface BlogSourceDefinition {
  code: string;
  name: string;
  url: string;
}

export interface BlogSourceCatalog {
  get(code: string): BlogSourceDefinition | undefined;
  list(): BlogSourceDefinition[];
  listCodes(): string[];
}
