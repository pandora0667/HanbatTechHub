import * as Parser from 'rss-parser';

export type RssFeedItem = Parser.Item & {
  description?: string;
  updated?: string;
  creator?: string;
  author?: string;
  'dc:creator'?: string;
};
