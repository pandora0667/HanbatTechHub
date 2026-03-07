import { Module } from '@nestjs/common';
import { GoogleTranslateProvider } from './providers/google-translate.provider';
import { TranslationService } from './services/translation.service';

@Module({
  providers: [GoogleTranslateProvider, TranslationService],
  exports: [TranslationService],
})
export class TranslationModule {}
