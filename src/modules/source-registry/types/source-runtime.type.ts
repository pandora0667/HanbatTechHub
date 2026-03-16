export type SourceRuntimeStatus = 'unknown' | 'healthy' | 'degraded' | 'failing';

export interface SourceRuntimeRecord {
  lastSuccessAt?: string;
  lastFailureAt?: string;
  failureCount: number;
  consecutiveFailures: number;
  lastErrorMessage?: string;
}
