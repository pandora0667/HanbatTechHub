export type WorkspaceActionType = 'apply' | 'review' | 'check' | 'read';
export type WorkspaceActionPriority = 'urgent' | 'high' | 'medium' | 'low';
export type WorkspaceActionSourceKind = 'opportunity' | 'institution' | 'content';

export interface WorkspaceActionItem {
  id: string;
  type: WorkspaceActionType;
  priority: WorkspaceActionPriority;
  sourceKind: WorkspaceActionSourceKind;
  title: string;
  subtitle: string;
  reason: string;
  url: string;
  company?: string;
  dueAt?: string;
  labels: string[];
}
