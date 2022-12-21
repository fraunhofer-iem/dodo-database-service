import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { CalculationEventPayload, Intervals } from '../lib';
import { ReleaseCycleService } from '../releaseCycles/releaseCycle.service';

@Injectable()
export class PrProcessingEfficiencyService {
  private readonly logger = new Logger(PrProcessingEfficiencyService.name);

  constructor(
    private repoService: RepositoryService,
    private eventEmitter: EventEmitter2,
    private releaseCycleService: ReleaseCycleService,
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

    pullRequests.forEach((element) => {
      console.log(element.number);
      console.log(element.created_at);
      console.log(element.closed_at);
    });

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

    console.log('ich war in PrsInProcess');
    let count = 0;
    pullRequests.forEach((element) => {
      count += 1;
      console.log('PullRequest: ', element.number);
      console.log(element.created_at);
      console.log(element.closed_at);
      console.log(element.merged_at);
    });
    console.log('how many PRs?: ', count);
    // console.log('--- --- --- --- ---');
    // openPRs.forEach((element) => {
    //   console.log('PullRequest: ', element.number);
    //   console.log(element.created_at);
    //   console.log(element.closed_at);
    //   console.log(element.merged_at);
    // });

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

    console.log(Object.keys(prsInProcess).length);

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
    const { prLatency } = data;
    const { threshold } = kpi.params;
    const avgReleaseCycleLenDays = (
      await this.releaseCycleService.releaseCycle(
        Intervals.DAY,
        kpi.target.owner,
        kpi.target.repo,
      )
    ).avg;
    console.log('avgDays:', avgReleaseCycleLenDays);
    const avgReleaseCycleLen = avgReleaseCycleLenDays * 24 * 60 * 60; // prLatency is in sec
    const expectedValue = avgReleaseCycleLen * (1 / 3);

    const expectedValueInDays = expectedValue / (24 * 60 * 60);
    const prProcessingEfficiency: { [key: string]: number } = {};
    if (typeof prLatency === 'undefined') {
      this.eventEmitter.emit('kpi.calculated', {
        kpi,
        release,
        since,
        value: {},
      });
    } else {
      for (const [pullRequest, latency] of Object.entries<number>(prLatency)) {
        prProcessingEfficiency[pullRequest] = latency / expectedValue;
      }

      this.eventEmitter.emit('kpi.calculated', {
        kpi,
        release,
        since,
        value: prProcessingEfficiency,
        ev: expectedValueInDays,
      });
    }
  }
}
