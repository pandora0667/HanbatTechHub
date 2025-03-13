export interface TranslationProvider {
  translate(text: string): Promise<string>;
}

export interface TranslationResponse {
  success: boolean;
  translatedText?: string;
  error?: string;
}

export interface TranslationConfig {
  model: string;
  apiKey: string;
  baseURL: string;
} 