import { Injectable } from '@nestjs/common';
import { GetContentFeedUseCase } from './application/use-cases/get-content-feed.use-case';
import { GetContentTrendsUseCase } from './application/use-cases/get-content-trends.use-case';
import { GetContentFeedQueryDto } from './dto/get-content-feed-query.dto';
import { GetContentTrendsQueryDto } from './dto/get-content-trends-query.dto';
import {
  ContentFeedResponseDto,
  ContentTrendsResponseDto,
} from './dto/content-intelligence.response.dto';

@Injectable()
export class ContentIntelligenceService {
  constructor(
    private readonly getContentFeedUseCase: GetContentFeedUseCase,
    private readonly getContentTrendsUseCase: GetContentTrendsUseCase,
  ) {}

  async getFeed(query: GetContentFeedQueryDto): Promise<ContentFeedResponseDto> {
    return this.getContentFeedUseCase.execute(query);
  }

  async getTrends(
    query: GetContentTrendsQueryDto,
  ): Promise<ContentTrendsResponseDto> {
    return this.getContentTrendsUseCase.execute(query);
  }
}
