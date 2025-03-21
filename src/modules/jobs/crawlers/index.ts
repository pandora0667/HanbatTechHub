import { Provider } from '@nestjs/common';
import { NaverCrawler } from './naver.crawler';
import { KakaoCrawler } from './kakao.crawler';
import { IJobCrawler } from '../interfaces/job-crawler.interface';
import { LineCrawler } from './line.crawler';
import { CoupangCrawler } from './coupang.crawler';
import { BaeminCrawler } from './baemin.crawler';
import { HttpClientUtil } from '../utils/http-client.util';
import { ConfigService } from '@nestjs/config';
import { DanggnCrawler } from './danggn.crawler';
import { TossCrawler } from './toss.crawler';

export const CRAWLER_TOKEN = 'CRAWLER_TOKEN';

// 크롤러 클래스 배열 - 새로운 크롤러를 여기에 추가하세요
const crawlerClasses = [
  NaverCrawler,
  KakaoCrawler,
  LineCrawler,
  CoupangCrawler,
  BaeminCrawler,
  DanggnCrawler,
  TossCrawler,
  // KakaoTechCrawler,
  // WoowabrosCrawler,
  // 추가 크롤러 클래스들...
];

// 동적 크롤러 등록 메커니즘 (새 크롤러 추가 시 위 배열만 수정하면 됨)
export const CRAWLER_PROVIDERS: Provider[] = [
  // 크롤러 인스턴스 모음을 제공하는 팩토리
  {
    provide: CRAWLER_TOKEN,
    useFactory: (...crawlerInstances: IJobCrawler[]) => crawlerInstances,
    inject: crawlerClasses,
  },
  // 각 크롤러 클래스를 개별 프로바이더로 등록
  ...crawlerClasses,
];

export const createCrawlers = (
  httpClient: HttpClientUtil,
  configService: ConfigService,
): IJobCrawler[] => {
  return [
    new NaverCrawler(httpClient, configService),
    new KakaoCrawler(httpClient, configService),
    new LineCrawler(httpClient, configService),
    new CoupangCrawler(httpClient, configService),
    new BaeminCrawler(httpClient, configService),
    new DanggnCrawler(httpClient, configService),
    new TossCrawler(httpClient, configService),
  ];
};

export * from './base-job.crawler';
export * from './naver.crawler';
export * from './kakao.crawler';
export * from './line.crawler';
export * from './coupang.crawler';
export * from './baemin.crawler';
export * from './danggn.crawler';
export * from './toss.crawler';
