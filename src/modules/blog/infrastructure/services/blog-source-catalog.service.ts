import { Injectable } from '@nestjs/common';
import { TECH_BLOG_RSS } from '../../constants/blog.constant';
import {
  BlogSourceCatalog,
  BlogSourceDefinition,
} from '../../application/ports/blog-source-catalog';

@Injectable()
export class BlogSourceCatalogService implements BlogSourceCatalog {
  private readonly sources: BlogSourceDefinition[] = Object.entries(
    TECH_BLOG_RSS,
  ).map(([code, source]) => ({
    code,
    name: source.name,
    url: source.url,
    headers: source.headers,
    requestOptions: source.requestOptions,
  }));

  get(code: string): BlogSourceDefinition | undefined {
    return this.sources.find((source) => source.code === code);
  }

  list(): BlogSourceDefinition[] {
    return [...this.sources];
  }

  listCodes(): string[] {
    return this.sources.map((source) => source.code);
  }
}
