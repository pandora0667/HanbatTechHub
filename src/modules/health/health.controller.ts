import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly baseUrl: string;

  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private configService: ConfigService,
  ) {
    const port = this.configService.get<string>('PORT', '3000');
    this.baseUrl = `http://localhost:${port}`;
  }

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'API 서비스 상태 확인' })
  check() {
    return this.health.check([
      // 시스템 상태 확인
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
      () =>
        this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),

      // 공지사항 API 상태 확인
      () =>
        this.http.pingCheck('notices_api', `${this.baseUrl}/api/v1/notices`),

      // 식단 메뉴 API 상태 확인
      () => this.http.pingCheck('menus_api', `${this.baseUrl}/api/v1/menus`),

      // 블로그 API 상태 확인
      () => this.http.pingCheck('blogs_api', `${this.baseUrl}/api/v1/blogs`),

      // 블로그 회사 목록 API 상태 확인
      () =>
        this.http.pingCheck(
          'blog_companies_api',
          `${this.baseUrl}/api/v1/blogs/companies`,
        ),
    ]);
  }
}
