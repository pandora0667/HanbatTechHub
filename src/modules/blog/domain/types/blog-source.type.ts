import { RequestOptions } from 'https';

export interface BlogSourceConfig {
  name: string;
  url: string;
  headers?: Record<string, string>;
  requestOptions?: RequestOptions;
}

export interface BlogSourceDefinition extends BlogSourceConfig {
  code: string;
}
