export interface TranslationProvider {
  translate(text: string): Promise<string>;
}
