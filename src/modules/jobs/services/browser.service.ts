import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import { Browser, Page } from 'puppeteer';

@Injectable()
export class BrowserService implements OnModuleDestroy {
  private readonly logger = new Logger(BrowserService.name);
  private browser: Browser | null = null;

  constructor(private readonly configService: ConfigService) {}

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await this.createBrowser();
    }
    return this.browser;
  }

  private async createBrowser(): Promise<Browser> {
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--hide-scrollbars',
      '--disable-notifications',
      '--disable-extensions',
      '--force-color-profile=srgb',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ];

    const browser = await puppeteer.launch({
      headless: true as any,
      args,
      defaultViewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      },
      timeout: 60000,
    });

    // 브라우저 이벤트 리스너 설정
    browser.on('disconnected', () => {
      this.logger.warn('Browser disconnected');
      this.browser = null;
    });

    browser.on('targetcreated', async (target) => {
      this.logger.debug('New target created:', target.url());
    });

    browser.on('targetchanged', async (target) => {
      this.logger.debug('Target changed:', target.url());
    });

    return browser;
  }

  async createPage(): Promise<Page | null> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // 콘솔 로그 캡처
      page.on('console', (msg) => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error') {
          this.logger.error('Browser Console:', text);
        } else {
          this.logger.debug('Browser Console:', text);
        }
      });

      // 페이지 오류 캡처
      page.on('pageerror', (error) => {
        this.logger.error('Page Error:', error);
      });

      // 요청 실패 캡처
      page.on('requestfailed', (request) => {
        this.logger.error('Request Failed:', {
          url: request.url(),
          errorText: request.failure()?.errorText,
          method: request.method(),
        });
      });

      return page;
    } catch (error) {
      this.logger.error('Error creating page:', error);
      return null;
    }
  }

  async closePage(page: Page): Promise<void> {
    try {
      if (!page.isClosed()) {
        await page.close({ runBeforeUnload: true });
      }
    } catch (error) {
      this.logger.error('Failed to close page:', error);
    }
  }

  async onModuleDestroy() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.logger.debug('Browser closed successfully');
      }
    } catch (error) {
      this.logger.error('Failed to close browser:', error);
    }
  }
} 