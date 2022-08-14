import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { min, sum } from 'lodash';
import { IssueService } from '../../../entities/issues/issue.service';
import { Issue } from '../../../entities/issues/model/schemas';
import { CalculationEventPayload, transformMapToObject } from '../lib';

@Injectable()
export class MeanTimeToResolutionService {
  private readonly logger = new Logger(MeanTimeToResolutionService.name);

  constructor(
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
      .exec();

    const timeToResolution: Map<string, number> = new Map<string, number>();
    for (const issue of issues) {
      let ttr = 0;
      if (issue.state === 'closed') {
        if (new Date(issue.closed_at) <= new Date(release.published_at)) {
          // issue was closed within the release window
          ttr =
            new Date(issue.closed_at).valueOf() -
            new Date(issue.created_at).valueOf();
        } else {
          // issue existed during the release window but was closed at a later point
          // therefore, it probably was open during this release window
          ttr =
            new Date(release.published_at).valueOf() -
            new Date(issue.created_at).valueOf();
        }
      } else {
        ttr =
          new Date(release.published_at).valueOf() -
          new Date(issue.created_at).valueOf();
      }
      timeToResolution.set(issue.node_id, ttr / 1000);
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
    let { timeToResolution } = data;
    const { labels } = kpi.params;
    if (timeToResolution === undefined) {
      timeToResolution = {};
    }

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
          $in: labels,
        },
      })
      .group({
        _id: '$_id',
        node_id: { $first: '$node_id' },
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
    let { meanTimeToResolution } = data;

    meanTimeToResolution = meanTimeToResolution.reduce(
      (mttr: number[], value: number) =>
        isNaN(value) ? mttr : [value, ...mttr],
      [],
    );

    const overallMeanTimeToResolution =
      sum(meanTimeToResolution) / meanTimeToResolution.length;
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: overallMeanTimeToResolution,
    });
  }

  @OnEvent('kpi.prepared.resolutionInTime')
  async resolutionInTime(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { overallMeanTimeToResolution } = data;
    const { expectedValue } = kpi.params;

    const resolutionInTime =
      1 - min([(overallMeanTimeToResolution / 2) * expectedValue, 1]);
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: resolutionInTime,
    });
  }
}
