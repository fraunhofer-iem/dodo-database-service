import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { CalculationEventPayload } from '../lib';

@Injectable()
export class PrProcessingEfficiencyService {
  private readonly logger = new Logger(PrProcessingEfficiencyService.name);

  constructor(
    private repoService: RepositoryService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('kpi.prepared.prLatency')
  public async prLatency(payload: CalculationEventPayload) {
    const { kpi, since, release } = payload;

    const pullRequests = await this.repoService
      .preAggregate(
        { _id: (release.repo as any)._id },
        {
          diffs: {
            pullRequest: {
              since: since ? since.toUTCString() : undefined,
              to: release.published_at,
            },
          },
        },
      )
      .unwind('$diffs')
      .replaceRoot('$diffs')
      .replaceRoot('$pullRequest')
      .match({
        closed_at: { $ne: null },
      })
      .exec();

    const prLatency: { [key: string]: number } = Object.fromEntries(
      pullRequests.map((pullRequest) => [
        pullRequest.url,
        (pullRequest.closed_at - pullRequest.created_at) / 1000,
      ]),
    );
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: prLatency,
    });
  }

  @OnEvent('kpi.prepared.prsInProcess')
  public async prsInProcess(payload: CalculationEventPayload) {
    const { kpi, since, release } = payload;

    const pullRequests = await this.repoService
      .preAggregate(
        { _id: (release.repo as any)._id },
        {
          diffs: {
            pullRequest: {
              since: since ? since.toUTCString() : undefined,
              to: release.published_at,
            },
          },
        },
      )
      .unwind('$diffs')
      .replaceRoot('$diffs')
      .replaceRoot('$pullRequest')
      .exec();

    const openPRs = await this.repoService
      .preAggregate(
        { _id: (release.repo as any)._id },
        {
          diffs: {
            pullRequest: {
              to: release.published_at,
            },
          },
        },
      )
      .unwind('$diffs')
      .replaceRoot('$diffs')
      .replaceRoot('$pullRequest')
      .exec();

    const prsInProcess: { [key: string]: string[] } = Object.fromEntries(
      pullRequests.map((pullRequest) => [
        pullRequest.url,
        openPRs
          .filter(
            (pr) =>
              pr.url !== pullRequest.url &&
              pr.created_at <= pullRequest.created_at &&
              pr.closed_at > pullRequest.created_at,
          )
          .map((pr) => pr.url),
      ]),
    );

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: prsInProcess,
    });
  }

  @OnEvent('kpi.prepared.prProcessingEfficiency')
  public async prProcessingEfficiency(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { prLatency, prsInProcess } = data;
    const { threshold } = kpi.params;

    const prProcessingEfficiency: { [key: string]: number } = {};
    for (const [pullRequest, latency] of Object.entries<number>(prLatency)) {
      prProcessingEfficiency[pullRequest] = latency / threshold;
    }

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: prProcessingEfficiency,
    });
  }
}
