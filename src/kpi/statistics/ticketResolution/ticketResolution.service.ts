import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { sum } from 'lodash';
import { Issue } from 'src/entities/issues/model/schemas';
import { IssueService } from '../../../entities/issues/issue.service';
import { CalculationEventPayload } from '../lib';

@Injectable()
export class TicketResolutionService {
  private readonly logger = new Logger(TicketResolutionService.name);

  constructor(
    private readonly issueService: IssueService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('kpi.prepared.resolutionCapability')
  public async resolutionCapability(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    let { timeToResolution } = data;
    if (timeToResolution === undefined) {
      timeToResolution = {};
    }
    const { labels, expectedResolutionTime } = kpi.params;

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

    const resolutionCapability =
      sum(
        issues.map((issue) =>
          timeToResolution[issue.node_id] <= expectedResolutionTime ? 1 : 0,
        ),
      ) / issues.length;
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: isNaN(resolutionCapability) ? 0 : resolutionCapability,
    });
  }

  @OnEvent('kpi.prepared.resolutionEfficiency')
  public async resolutionEfficiency(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    let { timeToResolution } = data;
    if (timeToResolution === undefined) {
      timeToResolution = {};
    }
    const { labels, expectedResolutionTime } = kpi.params;

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

    const resolutionEfficiency =
      sum(
        issues.map(
          (issue) => timeToResolution[issue.node_id] / expectedResolutionTime,
        ),
      ) / issues.length;
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: isNaN(resolutionEfficiency) ? 0 : resolutionEfficiency,
    });
  }

  @OnEvent('kpi.prepared.resolutionRate')
  public async resolutionRate(payload: CalculationEventPayload) {
    const { kpi, since, release } = payload;
    const { labels } = kpi.params;

    const issues: Issue[] = await this.issueService
      .preAggregate(
        { repo: (release.repo as any)._id },
        { to: release.published_at, labels: true },
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
        closed_at: { $first: '$closed_at' },
      })
      .exec();

    const closedIssues: Issue[] = [];
    for (const issue of issues) {
      if (issue.state === 'closed') {
        if (new Date(issue.closed_at) <= new Date(release.published_at)) {
          closedIssues.push(issue);
        }
      }
    }

    const resolutionRate = closedIssues.length / issues.length;

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: isNaN(resolutionRate) ? 0 : resolutionRate,
    });
  }

  @OnEvent('kpi.prepared.overallResolutionCapability')
  public async overallResolutionCapability(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    let { resolutionCapability } = data;
    resolutionCapability = resolutionCapability.reduce(
      (resCap: number[], value: number) =>
        isNaN(value) ? resCap : [value, ...resCap],
      [],
    );

    const overallResolutionCapability =
      sum(resolutionCapability) / resolutionCapability.length;
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: overallResolutionCapability,
    });
  }

  @OnEvent('kpi.prepared.overallResolutionEfficiency')
  public async overallResolutionEfficiency(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    let { resolutionEfficiency } = data;
    resolutionEfficiency = resolutionEfficiency.reduce(
      (resEff: number[], value: number) =>
        isNaN(value) ? resEff : [value, ...resEff],
      [],
    );

    const overallResolutionEfficiency =
      sum(resolutionEfficiency) / resolutionEfficiency.length;
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: overallResolutionEfficiency,
    });
  }
  @OnEvent('kpi.prepared.overallResolutionRate')
  public async overallResolutionRate(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    let { resolutionRate } = data;
    resolutionRate = resolutionRate.reduce(
      (resRate: number[], value: number) =>
        isNaN(value) ? resRate : [value, ...resRate],
      [],
    );

    const overallResolutionRate = sum(resolutionRate) / resolutionRate.length;
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: overallResolutionRate,
    });
  }
}
