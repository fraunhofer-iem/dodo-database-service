import { Injectable, Logger } from '@nestjs/common';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { RepositoryIdentifier } from 'src/entities/repositories/model';
import { Aggregate } from 'mongoose';
import {
  CalculationEventPayload,
  groupByIntervalSelector,
  Intervals,
  serialize,
  transformMapToObject,
} from '../lib';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Issue } from 'src/entities/issues/model/schemas';
import { IssueService } from 'src/entities/issues/issue.service';
import { sum } from 'lodash';

@Injectable()
export class MeanTimeToResolutionService {
  private readonly logger = new Logger(MeanTimeToResolutionService.name);

  constructor(
    private readonly repoService: RepositoryService,
    private readonly issueService: IssueService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('kpi.prepared.timeToResolution')
  async timeToResolution(payload: CalculationEventPayload) {
    const { kpi, since, release } = payload;

    const issues: Issue[] = await this.issueService
      .preAggregate(
        { repo: (release.repo as any)._id },
        { to: release.published_at },
      )
      .match({
        closed_at: {
          $gte: since,
        },
      })
      .exec();

    const timeToResolution: Map<string, number> = new Map<string, number>();
    for (const issue of issues) {
      timeToResolution.set(
        issue.node_id,
        new Date(issue.closed_at).valueOf() -
          new Date(issue.created_at).valueOf(),
      );
    }
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: transformMapToObject(timeToResolution),
    });
  }

  @OnEvent('kpi.prepared.meanTimeToResolution')
  async meanTimeToResolution(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { timeToResolution } = data;

    const issues: Issue[] = await this.issueService
      .preAggregate(
        { node_id: { $in: Object.keys(timeToResolution) } },
        { labels: true },
      )
      .match({
        labels: { $not: { $size: 0 } },
      })
      .unwind('labels')
      .match({
        'labels.name': {
          $in: kpi.params.labels,
        },
      })
      .exec();

    const meanTimeToResolution =
      sum(issues.map((issue) => timeToResolution[issue.node_id])) /
      issues.length;
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: meanTimeToResolution,
    });
  }

  @OnEvent('kpi.prepared.overallMeanTimeToResolution')
  async overallMeanTimeToResolution(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { meanTimeToResolution } = data;

    const overallMeanTimeToResolution =
      sum(meanTimeToResolution) / meanTimeToResolution.length;
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: overallMeanTimeToResolution,
    });
  }

  // async meanTimeToResolution(
  //   repoIdent: RepositoryIdentifier,
  //   interval: Intervals = Intervals.MONTH,
  //   labels: string[] = [], // calculate only for tickets with at least on of these labels
  //   since: string = undefined,
  //   to: string = undefined,
  // ) {
  //   const pipeline: Aggregate<
  //     {
  //       avg: number; // mean time to resolution (in seconds) for all tickets selected using labels parameter
  //       data: {
  //         // development of mean time to resolution over time
  //         _id: {
  //           // granularity information as defined by the interval parameter
  //           year: number | undefined;
  //           month: number | undefined;
  //           week: number | undefined;
  //           day: number | undefined;
  //         };
  //         avg: number; // mean time to resolution (in seconds) for current interval
  //         data: any[]; // time to resolution (in seconds) of tickets that have been closed in this interval
  //       }[];
  //     }[]
  //   > = this.repoService.preAggregate(repoIdent, {
  //     issues: { labels: true, since: since, to: to },
  //   });
  //   pipeline.unwind('issues');
  //   pipeline.replaceRoot('$issues');
  //   pipeline.match({
  //     labels: { $not: { $size: 0 } },
  //   });
  //   pipeline.unwind('labels');
  //   if (labels.length) {
  //     pipeline.match({
  //       'labels.name': {
  //         $in: labels,
  //       },
  //       state: 'closed',
  //     });
  //   }
  //   pipeline.addFields({
  //     timeToResolution: {
  //       $dateDiff: {
  //         startDate: '$created_at',
  //         endDate: '$closed_at',
  //         unit: 'second',
  //       },
  //     },
  //   });
  //   pipeline.group({
  //     _id: groupByIntervalSelector('$closed_at', interval),
  //     data: { $push: '$timeToResolution' },
  //   });
  //   pipeline.addFields({
  //     avg: { $avg: '$data' },
  //   });
  //   pipeline.group({
  //     _id: null,
  //     sum: { $sum: { $multiply: ['$avg', { $size: '$data' }] } },
  //     tickets: { $sum: { $size: '$data' } },
  //     data: { $push: '$$ROOT' },
  //   });
  //   pipeline.project({
  //     avg: { $divide: ['$sum', '$tickets'] },
  //     data: 1,
  //   });

  //   const [result] = await pipeline.exec();
  //   try {
  //     return serialize(result, interval, 'resolutionTimes');
  //   } catch (err) {
  //     this.logger.error(err);
  //     throw err;
  //   }
  // }
}
