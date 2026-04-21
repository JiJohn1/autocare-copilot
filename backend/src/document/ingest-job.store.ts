import { Injectable } from '@nestjs/common';
import { IngestJob } from './dto/ingest-job.dto';

@Injectable()
export class IngestJobStore {
  private readonly jobs = new Map<string, IngestJob>();

  set(job: IngestJob): void {
    this.jobs.set(job.jobId, job);
  }

  get(jobId: string): IngestJob | undefined {
    return this.jobs.get(jobId);
  }

  update(
    jobId: string,
    patch: Omit<Partial<IngestJob>, 'progress'> & { progress?: Partial<IngestJob['progress']> },
  ): void {
    const job = this.jobs.get(jobId);
    if (job) {
      const mergedProgress = patch.progress
        ? { ...job.progress, ...patch.progress }
        : job.progress;
      this.jobs.set(jobId, { ...job, ...patch, progress: mergedProgress });
    }
  }

  /** 24시간 초과된 job 정리 */
  cleanup(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const [id, job] of this.jobs) {
      if (new Date(job.startedAt).getTime() < cutoff) this.jobs.delete(id);
    }
  }
}
