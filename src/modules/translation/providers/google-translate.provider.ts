import { Injectable, Logger } from '@nestjs/common';
import { TranslationProvider } from './provider.interface';
import axios from 'axios';

@Injectable()
export class GoogleTranslateProvider implements TranslationProvider {
  private readonly logger = new Logger(GoogleTranslateProvider.name);
  private readonly endpoint = 'https://translate.google.com/m';
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private removeControlCharacters(text: string): string {
    return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  }

  private unescapeHtml(text: string): string {
    const htmlEntities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
    };
    return text.replace(
      /&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g,
      (match) => htmlEntities[match],
    );
  }

  private findTranslation(html: string): string {
    // 디버깅을 위해 HTML 내용 로깅
    this.logger.debug('Response HTML structure:');
    this.logger.debug(html);

    // 번역된 텍스트 추출 (Google Translate mobile 버전의 HTML 구조에 맞춤)
    const translationMatch =
      html.match(/class="result-container">(.*?)<\/div>/s) ||
      html.match(/class="t0">(.*?)<\/div>/s) ||
      html.match(/class="translation">(.*?)<\/div>/s);

    if (!translationMatch) {
      this.logger.error('Translation pattern not found in HTML:', html);
      throw new Error('Translation result not found in response');
    }

    let translatedText = translationMatch[1].trim();
    translatedText = this.unescapeHtml(translatedText);
    translatedText = this.removeControlCharacters(translatedText);

    // [...] 제거
    translatedText = translatedText.replace(/\[…\]|\[\.{3}\]|\[\.\.\.\]/g, '');

    return translatedText;
  }

  async translate(text: string): Promise<string> {
    try {
      // Google translate max length
      const truncatedText = text.slice(0, 5000);

      const response = await axios.get(this.endpoint, {
        params: {
          tl: 'ko', // target language: Korean
          sl: 'en', // source language: English
          q: truncatedText,
          ie: 'UTF-8',
          oe: 'UTF-8',
        },
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (response.status === 400) {
        throw new Error('IRREPARABLE TRANSLATION ERROR');
      }

      const translatedText = this.findTranslation(response.data);

      // 번역 완료 후 2초 대기
      this.logger.debug(
        'Translation completed, waiting 2 seconds before next request...',
      );
      await this.sleep(2000);

      return translatedText;
    } catch (error) {
      if (error.response) {
        this.logger.error(
          `Google translation failed with status ${error.response.status}`,
        );
        this.logger.debug('Response headers:', error.response.headers);
      }
      this.logger.error(
        `Google translation failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
