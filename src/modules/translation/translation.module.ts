import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleTranslateProvider } from './providers/google-translate.provider';
import { TranslationService } from './services/translation.service';

@Module({
  imports: [ConfigModule],
  providers: [GoogleTranslateProvider, TranslationService],
  exports: [TranslationService],
})
export class TranslationModule {}
