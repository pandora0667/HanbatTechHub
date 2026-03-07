import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import {
  BlogResponseDto,
  CompanyListResponseDto,
} from './dto/blog-response.dto';
import { BlogQueryDto } from './dto/blog-query.dto';

@ApiTags('blogs')
@Controller('blogs')
export class BlogController {
  private readonly logger = new Logger(BlogController.name);

  constructor(private readonly blogService: BlogService) {}

  @Get()
  @ApiOperation({ summary: '전체 기술 블로그 포스트 조회' })
  @ApiResponse({
    status: 200,
    description: '기술 블로그 포스트 목록',
    type: BlogResponseDto,
  })
  async getAllPosts(
    @Query() query: BlogQueryDto,
  ): Promise<BlogResponseDto> {
    this.logger.log(`Getting all posts: page=${query.page}, limit=${query.limit}`);
    return this.blogService.getAllPosts(query.page, query.limit);
  }

  @Get('companies')
  @ApiOperation({ summary: '기술 블로그 회사 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '회사 목록',
    type: [CompanyListResponseDto],
  })
  async getCompanyList(): Promise<CompanyListResponseDto[]> {
    this.logger.log('Getting company list');
    return this.blogService.getCompanyList();
  }

  @Get('companies/:company')
  @ApiOperation({ summary: '특정 회사의 기술 블로그 포스트 조회' })
  @ApiResponse({
    status: 200,
    description: '회사별 기술 블로그 포스트 목록',
    type: BlogResponseDto,
  })
  async getCompanyPosts(
    @Param('company') company: string,
    @Query() query: BlogQueryDto,
  ): Promise<BlogResponseDto> {
    this.logger.log(
      `Getting posts for company ${company}: page=${query.page}, limit=${query.limit}`,
    );
    return this.blogService.getCompanyPosts(company, query.page, query.limit);
  }
}
