import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleTranslateProvider } from '../providers/google-translate.provider';

export interface TranslationResult {
  success: boolean;
  translatedTitle?: string;
  translatedDescription?: string;
  error?: string;
}

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly googleTranslateProvider: GoogleTranslateProvider,
  ) {}

  async translate(text: string): Promise<string> {
    if (!text || text.trim() === '') {
      return '';
    }

    // 한글이 포함되어 있으면 번역하지 않음
    if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text)) {
      return text;
    }

    try {
      return await this.googleTranslateProvider.translate(text);
    } catch (error) {
      this.logger.error(`Translation error: ${error.message}`);
      return text;
    }
  }

  async translateBlogPost(
    title: string,
    description: string,
  ): Promise<TranslationResult> {
    try {
      this.logger.log(`Starting translation for blog post: ${title}`);

      const translatedTitle = await this.translate(title);
      const translatedDescription = await this.translate(description);

      this.logger.debug(`Translated title: ${translatedTitle}`);
      this.logger.debug(`Translated description: ${translatedDescription}`);

      return {
        success: true,
        translatedTitle,
        translatedDescription,
      };
    } catch (error) {
      this.logger.error(`Translation failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
