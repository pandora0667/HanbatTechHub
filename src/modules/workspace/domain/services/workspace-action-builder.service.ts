import { Injectable } from '@nestjs/common';
import { BlogPost } from '../../../blog/interfaces/blog.interface';
import { NoticeSummary } from '../../../notice/domain/models/notice.model';
import {
  WorkspaceActionItem,
  WorkspaceActionPriority,
} from '../models/workspace-action-item.model';

interface UpcomingDeadlineInput {
  severity: string;
  id: string;
  company: string;
  title: string;
  department: string;
  field: string;
  deadline: string;
  daysRemaining: number;
  url: string;
}

interface JobChangeInput {
  changeType: string;
  jobId: string;
  company: string;
  title: string;
  department: string;
  field: string;
  url: string;
  deadline: string;
  changedFields?: string[];
}

@Injectable()
export class WorkspaceActionBuilderService {
  fromUpcomingDeadline(signal: UpcomingDeadlineInput): WorkspaceActionItem {
    return {
      id: `deadline:${signal.company}:${signal.id}`,
      type: 'apply',
      priority: this.mapDeadlinePriority(signal.severity),
      sourceKind: 'opportunity',
      title: signal.title,
      subtitle: `${signal.company} · ${signal.department} · ${signal.field}`,
      reason:
        signal.severity === 'closing_today'
          ? '오늘 마감되는 채용 공고입니다.'
          : '곧 마감되는 채용 공고입니다.',
      url: signal.url,
      company: signal.company,
      dueAt: signal.deadline,
      labels: [signal.company, signal.field, `D-${signal.daysRemaining}`],
    };
  }

  fromJobChange(signal: JobChangeInput): WorkspaceActionItem {
    const isNew = signal.changeType === 'new';

    return {
      id: `job-change:${signal.company}:${signal.jobId}:${signal.changeType}`,
      type: 'review',
      priority: isNew ? 'high' : 'medium',
      sourceKind: 'opportunity',
      title: signal.title,
      subtitle: `${signal.company} · ${signal.department} · ${signal.field}`,
      reason: isNew
        ? '새로 올라온 채용 공고입니다.'
        : '조건이 변경된 채용 공고입니다.',
      url: signal.url,
      company: signal.company,
      dueAt: signal.deadline,
      labels: [
        signal.company,
        signal.field,
        signal.changeType,
        ...(signal.changedFields ?? []).slice(0, 2),
      ],
    };
  }

  fromNotice(notice: NoticeSummary): WorkspaceActionItem {
    const priority: WorkspaceActionPriority =
      notice.hasAttachment || notice.isNew ? 'medium' : 'low';

    return {
      id: `notice:${notice.nttId}`,
      type: 'check',
      priority,
      sourceKind: 'institution',
      title: notice.title,
      subtitle: `${notice.author} · ${notice.date}`,
      reason: notice.hasAttachment
        ? '첨부가 포함된 기관 공지입니다.'
        : '확인할 기관 공지입니다.',
      url: notice.link,
      labels: [
        'institution',
        ...(notice.hasAttachment ? ['attachment'] : []),
        ...(notice.isNew ? ['new'] : []),
      ],
    };
  }

  fromContent(post: BlogPost): WorkspaceActionItem {
    return {
      id: `content:${post.company}:${post.id}`,
      type: 'read',
      priority: 'low',
      sourceKind: 'content',
      title: post.title,
      subtitle: `${post.company} · ${post.publishDate.toISOString().slice(0, 10)}`,
      reason: '맥락 파악을 위한 최신 기술 콘텐츠입니다.',
      url: post.link,
      company: post.company,
      labels: [post.company, 'content'],
    };
  }

  rank(items: WorkspaceActionItem[], limit: number): WorkspaceActionItem[] {
    const deduped = new Map<string, WorkspaceActionItem>();

    for (const item of items) {
      const key = this.resolveDeduplicationKey(item);
      const existing = deduped.get(key);
      if (!existing || this.score(item) > this.score(existing)) {
        deduped.set(key, item);
      }
    }

    return Array.from(deduped.values())
      .sort((left, right) => this.compare(left, right))
      .slice(0, limit);
  }

  private mapDeadlinePriority(
    severity: UpcomingDeadlineInput['severity'],
  ): WorkspaceActionPriority {
    if (severity === 'closing_today') {
      return 'urgent';
    }

    if (severity === 'closing_soon') {
      return 'high';
    }

    return 'medium';
  }

  private compare(left: WorkspaceActionItem, right: WorkspaceActionItem): number {
    const scoreGap = this.score(right) - this.score(left);
    if (scoreGap !== 0) {
      return scoreGap;
    }

    const leftDue = left.dueAt ? new Date(left.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    const rightDue = right.dueAt ? new Date(right.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    if (leftDue !== rightDue) {
      return leftDue - rightDue;
    }

    return left.title.localeCompare(right.title);
  }

  private score(item: WorkspaceActionItem): number {
    const priorityScore = {
      urgent: 400,
      high: 300,
      medium: 200,
      low: 100,
    }[item.priority];
    const typeScore = {
      apply: 40,
      review: 30,
      check: 20,
      read: 10,
    }[item.type];

    return priorityScore + typeScore;
  }

  private resolveDeduplicationKey(item: WorkspaceActionItem): string {
    if (item.url) {
      return `${item.sourceKind}:${item.url}`;
    }

    return item.id;
  }
}
