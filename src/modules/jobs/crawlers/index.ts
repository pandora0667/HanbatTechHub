import { Provider } from '@nestjs/common';
import { NaverCrawler } from './naver.crawler';
import { KakaoCrawler } from './kakao.crawler';
import { IJobCrawler } from '../interfaces/job-crawler.interface';

export const CRAWLER_TOKEN = 'CRAWLER_TOKEN';

// 크롤러 클래스 배열 - 새로운 크롤러를 여기에 추가하세요
const crawlerClasses = [
  NaverCrawler,
  KakaoCrawler,
  // KakaoTechCrawler,
  // LineCrawler,
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

export * from './naver.crawler';
export * from './base-job.crawler';
export * from './example.crawler';
