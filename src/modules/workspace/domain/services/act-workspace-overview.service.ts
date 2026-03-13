import { Injectable } from '@nestjs/common';
import { WorkspaceActionItem } from '../models/workspace-action-item.model';

@Injectable()
export class ActWorkspaceOverviewService {
  build(actions: WorkspaceActionItem[]) {
    return actions.reduce(
      (summary, action) => {
        summary.totalActions += 1;
        summary[action.priority] += 1;

        if (action.type === 'apply') {
          summary.applyNow += 1;
        }

        if (action.type === 'read') {
          summary.readNow += 1;
        }

        return summary;
      },
      {
        totalActions: 0,
        urgent: 0,
        high: 0,
        medium: 0,
        low: 0,
        applyNow: 0,
        readNow: 0,
      },
    );
  }
}
