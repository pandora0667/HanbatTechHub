import { Inject, Injectable } from '@nestjs/common';
import {
  BLOG_SOURCE_CATALOG,
  BlogSourceCatalog,
} from '../ports/blog-source-catalog';
import { BlogCompany } from '../../domain/types/blog-company.type';

@Injectable()
export class GetBlogCompaniesUseCase {
  constructor(
    @Inject(BLOG_SOURCE_CATALOG)
    private readonly blogSourceCatalog: BlogSourceCatalog,
  ) {}

  execute(): BlogCompany[] {
    return this.blogSourceCatalog.list().map((company) => ({
      code: company.code,
      name: company.name,
    }));
  }
}
