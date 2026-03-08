export { BlogSourceDefinition } from '../../domain/types/blog-source.type';
import { BlogSourceDefinition } from '../../domain/types/blog-source.type';

export const BLOG_SOURCE_CATALOG = 'BLOG_SOURCE_CATALOG';

export interface BlogSourceCatalog {
  get(code: string): BlogSourceDefinition | undefined;
  list(): BlogSourceDefinition[];
  listCodes(): string[];
}
