import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { JobPosting } from '../../interfaces/job-posting.interface';
import {
  JobPostingChangeResult,
  JobPostingChangeSignal,
  JobPostingChangeSummary,
  JobPostingChangeType,
} from '../models/job-posting-change.model';
import { SnapshotMetadata } from '../../../../common/types/snapshot.types';

type ComparableJobField =
  | 'title'
  | 'department'
  | 'field'
  | 'employmentType'
  | 'locations'
  | 'description'
  | 'qualifications'
  | 'preferences'
  | 'benefits'
  | 'skills'
  | 'period'
  | 'url'
  | 'tags'
  | 'jobCategory'
  | 'jobSubCategory';

interface DetectJobChangesInput {
  previousJobs?: JobPosting[];
  currentJobs: JobPosting[];
  generatedAt: Date;
  snapshot?: SnapshotMetadata;
  baselineCollectedAt?: string;
}

@Injectable()
export class JobPostingChangeDetectorService {
  detect(input: DetectJobChangesInput): JobPostingChangeResult {
    if (!input.previousJobs || input.previousJobs.length === 0) {
      return this.createEmptyResult(input.generatedAt, input.snapshot);
    }

    const previousJobs = new Map(
      input.previousJobs.map((job) => [this.buildCanonicalKey(job), job]),
    );
    const currentJobs = new Map(
      input.currentJobs.map((job) => [this.buildCanonicalKey(job), job]),
    );
    const signals: JobPostingChangeSignal[] = [];

    for (const [key, currentJob] of currentJobs) {
      const previousJob = previousJobs.get(key);

      if (!previousJob) {
        signals.push(this.toSignal('new', currentJob));
        continue;
      }

      if (this.computeFingerprint(previousJob) !== this.computeFingerprint(currentJob)) {
        signals.push(
          this.toSignal(
            'updated',
            currentJob,
            this.collectChangedFields(previousJob, currentJob),
          ),
        );
      }
    }

    for (const [key, previousJob] of previousJobs) {
      if (!currentJobs.has(key)) {
        signals.push(this.toSignal('removed', previousJob));
      }
    }

    signals.sort((left, right) => this.compareSignals(left, right));

    return {
      generatedAt: input.generatedAt.toISOString(),
      baselineCollectedAt: input.baselineCollectedAt,
      snapshot: input.snapshot,
      summary: this.summarize(signals),
      signals,
    };
  }

  private createEmptyResult(
    generatedAt: Date,
    snapshot?: SnapshotMetadata,
  ): JobPostingChangeResult {
    return {
      generatedAt: generatedAt.toISOString(),
      snapshot,
      summary: {
        total: 0,
        created: 0,
        updated: 0,
        removed: 0,
      },
      signals: [],
    };
  }

  private buildCanonicalKey(job: JobPosting): string {
    return `${job.company}:${job.id}`;
  }

  private computeFingerprint(job: JobPosting): string {
    const normalized = {
      title: job.title,
      department: job.department,
      field: job.field,
      employmentType: job.employmentType,
      locations: [...job.locations].sort(),
      description: job.description ?? '',
      qualifications: [...(job.qualifications ?? [])].sort(),
      preferences: [...(job.preferences ?? [])].sort(),
      benefits: [...(job.benefits ?? [])].sort(),
      skills: [...(job.requirements.skills ?? [])].sort(),
      period: {
        start: new Date(job.period.start).toISOString(),
        end: new Date(job.period.end).toISOString(),
      },
      url: job.url,
      tags: [...(job.tags ?? [])].sort(),
      jobCategory: job.jobCategory ?? '',
      jobSubCategory: job.jobSubCategory ?? '',
    };

    return createHash('sha1')
      .update(JSON.stringify(normalized))
      .digest('hex');
  }

  private collectChangedFields(
    previousJob: JobPosting,
    currentJob: JobPosting,
  ): string[] {
    const previousComparable = this.toComparableMap(previousJob);
    const currentComparable = this.toComparableMap(currentJob);
    const changedFields: ComparableJobField[] = [];

    for (const field of Object.keys(previousComparable) as ComparableJobField[]) {
      if (previousComparable[field] !== currentComparable[field]) {
        changedFields.push(field);
      }
    }

    return changedFields;
  }

  private toComparableMap(job: JobPosting): Record<ComparableJobField, string> {
    return {
      title: job.title,
      department: job.department,
      field: job.field,
      employmentType: job.employmentType,
      locations: JSON.stringify([...job.locations].sort()),
      description: job.description ?? '',
      qualifications: JSON.stringify([...(job.qualifications ?? [])].sort()),
      preferences: JSON.stringify([...(job.preferences ?? [])].sort()),
      benefits: JSON.stringify([...(job.benefits ?? [])].sort()),
      skills: JSON.stringify([...(job.requirements.skills ?? [])].sort()),
      period: JSON.stringify({
        start: new Date(job.period.start).toISOString(),
        end: new Date(job.period.end).toISOString(),
      }),
      url: job.url,
      tags: JSON.stringify([...(job.tags ?? [])].sort()),
      jobCategory: job.jobCategory ?? '',
      jobSubCategory: job.jobSubCategory ?? '',
    };
  }

  private toSignal(
    changeType: JobPostingChangeType,
    job: JobPosting,
    changedFields?: string[],
  ): JobPostingChangeSignal {
    return {
      type: 'job_change',
      changeType,
      jobId: job.id,
      company: job.company,
      title: job.title,
      department: job.department,
      field: job.field,
      url: job.url,
      locations: [...job.locations],
      deadline: new Date(job.period.end).toISOString(),
      changedFields: changedFields && changedFields.length > 0
        ? changedFields
        : undefined,
    };
  }

  private summarize(signals: JobPostingChangeSignal[]): JobPostingChangeSummary {
    return signals.reduce<JobPostingChangeSummary>(
      (summary, signal) => {
        summary.total += 1;

        if (signal.changeType === 'new') {
          summary.created += 1;
        } else if (signal.changeType === 'updated') {
          summary.updated += 1;
        } else {
          summary.removed += 1;
        }

        return summary;
      },
      {
        total: 0,
        created: 0,
        updated: 0,
        removed: 0,
      },
    );
  }

  private compareSignals(
    left: JobPostingChangeSignal,
    right: JobPostingChangeSignal,
  ): number {
    const severityOrder: Record<JobPostingChangeType, number> = {
      new: 0,
      updated: 1,
      removed: 2,
    };

    return (
      severityOrder[left.changeType] - severityOrder[right.changeType] ||
      left.company.localeCompare(right.company) ||
      left.title.localeCompare(right.title)
    );
  }
}
