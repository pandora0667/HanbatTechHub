import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { JOB_CRAWLING_CONFIG } from '../constants/redis.constant';

/**
 * HTTP 요청 유틸리티 클래스
 * 크롤러에서 공통으로 사용하는 HTTP 요청 기능을 제공합니다.
 */
@Injectable()
export class HttpClientUtil {
  private readonly logger = new Logger(HttpClientUtil.name);
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: JOB_CRAWLING_CONFIG.REQUEST_TIMEOUT,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    // 인터셉터 설정
    this.setupInterceptors();
  }

  /**
   * 요청 및 응답 인터셉터 설정
   */
  private setupInterceptors(): void {
    // 요청 인터셉터
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // 랜덤 User-Agent 추가
        if (!config.headers['User-Agent']) {
          const userAgents = JOB_CRAWLING_CONFIG.USER_AGENTS;
          const randomUserAgent =
            userAgents[Math.floor(Math.random() * userAgents.length)];
          config.headers['User-Agent'] = randomUserAgent;
        }
        return config;
      },
      (error) => {
        this.logger.error(`Request error: ${error.message}`);
        return Promise.reject(error);
      },
    );

    // 응답 인터셉터
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response) {
          this.logger.error(
            `Response error: ${error.response.status} - ${error.message}`,
          );
        } else if (error.request) {
          this.logger.error(`Request error: ${error.message}`);
        } else {
          this.logger.error(`Error: ${error.message}`);
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * GET 요청 수행
   * @param url 요청 URL
   * @param config 요청 설정
   * @returns 응답 데이터
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.get(
        url,
        config,
      );
      return response.data;
    } catch (error) {
      this.logger.error(`GET request failed: ${url} - ${error.message}`);
      throw error;
    }
  }

  /**
   * POST 요청 수행
   * @param url 요청 URL
   * @param data 요청 데이터
   * @param config 요청 설정
   * @returns 응답 데이터
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.post(
        url,
        data,
        config,
      );
      return response.data;
    } catch (error) {
      this.logger.error(`POST request failed: ${url} - ${error.message}`);
      throw error;
    }
  }

  /**
   * 여러 요청을 제한된 동시성으로 처리
   * @param tasks 요청 함수 배열
   * @param concurrency 동시 요청 수
   * @param delayMs 요청 간 지연 시간 (ms)
   * @returns 응답 배열
   */
  async batchRequest<T>(
    tasks: (() => Promise<T>)[],
    concurrency = JOB_CRAWLING_CONFIG.MAX_CONCURRENT_REQUESTS,
    delayMs = JOB_CRAWLING_CONFIG.REQUEST_DELAY,
  ): Promise<T[]> {
    const results: Array<T | null> = [];
    let index = 0;

    const executeBatch = async (): Promise<void> => {
      if (index >= tasks.length) return;

      const currentIndex = index++;
      const task = tasks[currentIndex];

      try {
        // 요청 실행
        const result = await task();
        results[currentIndex] = result;
      } catch (error) {
        this.logger.error(
          `Batch request failed at index ${currentIndex}: ${error.message}`,
        );
        // 실패한 요청은 null로 표시
        results[currentIndex] = null;
      }

      // 지연 후 다음 요청
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      // 다음 작업 실행
      await executeBatch();
    };

    // 동시 요청 시작
    const batches = Array(Math.min(concurrency, tasks.length))
      .fill(null)
      .map(() => executeBatch());

    await Promise.all(batches);

    // null이 아닌 결과만 필터링
    return results.filter((result): result is T => result !== null);
  }

  /**
   * 랜덤 User-Agent 반환
   * @returns 랜덤 User-Agent 문자열
   */
  getRandomUserAgent(): string {
    const userAgents = JOB_CRAWLING_CONFIG.USER_AGENTS;
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * 랜덤 지연 시간 생성
   * @param minMs 최소 지연 시간 (ms)
   * @param maxMs 최대 지연 시간 (ms)
   * @returns 지연 시간 (ms)
   */
  getRandomDelay(minMs: number, maxMs: number): number {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  }

  /**
   * 지정된 시간만큼 지연
   * @param ms 지연 시간 (ms)
   */
  async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
