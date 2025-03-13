import { Injectable, Logger } from '@nestjs/common';
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
    private readonly googleTranslateProvider: GoogleTranslateProvider,
  ) {}

  async translateBlogPost(
    title: string,
    description: string,
  ): Promise<TranslationResult> {
    try {
      this.logger.log(`Starting translation for blog post: ${title}`);

      // 제목과 설명을 함께 번역하여 API 호출 최소화
      const combinedText = `Title: ${title}\nDescription: ${description}`;
      const translatedText =
        await this.googleTranslateProvider.translate(combinedText);

      // 번역된 텍스트에서 제목과 설명 분리
      const titleMatch = translatedText.match(
        /제목\s*:\s*(.*?)(?=\n|설명\s*:|$)/,
      );
      const descriptionMatch = translatedText.match(/설명\s*:\s*(.*?)(?=\n|$)/);

      const translatedTitle = titleMatch?.[1]?.trim();
      const translatedDescription = descriptionMatch?.[1]?.trim();

      this.logger.debug(`Translated title: ${translatedTitle}`);
      this.logger.debug(`Translated description: ${translatedDescription}`);

      return {
        success: true,
        translatedTitle: translatedTitle || '',
        translatedDescription: translatedDescription || '',
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