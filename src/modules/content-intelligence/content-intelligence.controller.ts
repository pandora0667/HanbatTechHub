import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetContentFeedQueryDto } from './dto/get-content-feed-query.dto';
import { GetContentTrendsQueryDto } from './dto/get-content-trends-query.dto';
import {
  ContentFeedResponseDto,
  ContentTrendsResponseDto,
} from './dto/content-intelligence.response.dto';
import { ContentIntelligenceService } from './content-intelligence.service';

@ApiTags('content')
@Controller('content')
export class ContentIntelligenceController {
  constructor(
    private readonly contentIntelligenceService: ContentIntelligenceService,
  ) {}

  @Get('feed')
  @ApiOperation({
    summary: 'content intelligence feed 조회',
  })
  @ApiResponse({
    status: 200,
    description: '기술 블로그 기반 content feed',
    type: ContentFeedResponseDto,
  })
  async getFeed(
    @Query() query: GetContentFeedQueryDto,
  ): Promise<ContentFeedResponseDto> {
    return this.contentIntelligenceService.getFeed(query);
  }

  @Get('trends')
  @ApiOperation({
    summary: 'content trends 조회',
  })
  @ApiResponse({
    status: 200,
    description: '최근 content topic trends',
    type: ContentTrendsResponseDto,
  })
  async getTrends(
    @Query() query: GetContentTrendsQueryDto,
  ): Promise<ContentTrendsResponseDto> {
    return this.contentIntelligenceService.getTrends(query);
  }
}
