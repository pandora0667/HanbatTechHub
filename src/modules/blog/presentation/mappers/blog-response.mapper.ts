import { Injectable } from '@nestjs/common';
import { BlogCompany } from '../../domain/types/blog-company.type';
import { PaginatedBlogPosts } from '../../domain/types/paginated-blog-posts.type';
import {
  BlogResponseDto,
  CompanyListResponseDto,
} from '../../dto/blog-response.dto';

@Injectable()
export class BlogResponseMapper {
  toPostsResponse(result: PaginatedBlogPosts): BlogResponseDto {
    return {
      items: result.items.map((post) => ({
        id: post.id,
        company: post.company,
        title: post.title,
        description: post.description,
        link: post.link,
        author: post.author,
        publishDate: post.publishDate,
      })),
      meta: result.meta,
    };
  }

  toCompanyList(companies: BlogCompany[]): CompanyListResponseDto[] {
    return companies.map((company) => ({
      code: company.code,
      name: company.name,
    }));
  }
}
