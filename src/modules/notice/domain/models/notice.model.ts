export interface NoticeSummary {
  no: string;
  title: string;
  author: string;
  viewCount: number;
  date: string;
  link: string;
  hasAttachment: boolean;
  isNew: boolean;
  nttId: string;
}

export interface NoticeAttachment {
  name: string;
  link: string;
}

export interface NoticeDetail {
  no: string;
  title: string;
  author: string;
  viewCount: number;
  date: string;
  content: string;
  attachments: NoticeAttachment[];
}

export interface NoticeGroups {
  regular: NoticeSummary[];
  featured: NoticeSummary[];
  new: NoticeSummary[];
  today: NoticeSummary[];
}
