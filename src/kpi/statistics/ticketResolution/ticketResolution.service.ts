import { ConsoleLogger, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { sum } from 'lodash';
import { Issue } from 'src/entities/issues/model/schemas';
import { IssueService } from '../../../entities/issues/issue.service';
import { CalculationEventPayload, Intervals } from '../lib';
import { ReleaseCycleService } from '../releaseCycles/releaseCycle.service';

@Injectable()
export class TicketResolutionService {
  private readonly logger = new Logger(TicketResolutionService.name);

  constructor(
    private readonly issueService: IssueService,
    private readonly eventEmitter: EventEmitter2,
    private readonly releaseCycleService: ReleaseCycleService,
  ) {}

  @OnEvent('kpi.prepared.resolutionCapability')
  public async resolutionCapability(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { labels } = kpi.params;
    const issuesSinceRelease: Issue[] = await this.issueService
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
        node_id: { $first: '$node_id' },
        created_at: { $first: '$created_at' },
        closed_at: { $first: '$closed_at' },
        state: { $first: '$state' },
      })
      .exec();

    // labels considered
    let allIssuesSinceThisRelease = issuesSinceRelease.length;
    let issuesClosedBeforeThisRelease = 0;
    let issuesClosedInThisRelease = 0;
    for (const issue of issuesSinceRelease) {
      if (issue.state === 'closed') {
        if (
          new Date(since) <= new Date(issue.closed_at) &&
          new Date(issue.closed_at) <= new Date(release.published_at)
        ) {
          issuesClosedInThisRelease += 1;
        } else if (new Date(issue.closed_at) <= new Date(since)) {
          issuesClosedBeforeThisRelease += 1;
        }
      }
    }

    console.log('closed in this release:', issuesClosedInThisRelease);
    console.log(
      'all open tickets since this release:',
      allIssuesSinceThisRelease - issuesClosedBeforeThisRelease,
    );
    const resolutionCapability =
      issuesClosedInThisRelease /
      (allIssuesSinceThisRelease - issuesClosedBeforeThisRelease);
    // ticketsClosedInRelease / allOpenTicketsUntilReleaseEnd

    // 0 can only come up if nothing was solved
    // Undefined is if there are no open tickets for this label in this release at all
    // undefined is the same as {}
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: isNaN(resolutionCapability) ? undefined : resolutionCapability,
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

    const issuesSinceRelease: Issue[] = await this.issueService
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

    const avgReleaseCycleLenDays = (
      await this.releaseCycleService.releaseCycle(
        Intervals.DAY,
        kpi.target.owner,
        kpi.target.repo,
      )
    ).avg;
    console.log('avgDays:', avgReleaseCycleLenDays);
    const avgReleaseCycleLen = avgReleaseCycleLenDays * 24 * 60 * 60; // timeToResolution is in sec
    const expectedValue = avgReleaseCycleLen * 2.5;

    const expectedValueInDays = expectedValue / (24 * 60 * 60);
    const resolutionEfficiency =
      sum(
        issuesSinceRelease.map(
          (issue) => timeToResolution[issue.node_id] / expectedValue,
        ),
      ) / issuesSinceRelease.length;

    // undefined if there are no tickets in this release for this label
    // undefined is excluded in mean calculation automatically
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: isNaN(resolutionEfficiency) ? undefined : resolutionEfficiency,
      ev: expectedValueInDays,
    });
  }

  @OnEvent('kpi.prepared.resolutionRate')
  public async resolutionRate(payload: CalculationEventPayload) {
    const { kpi, since, release } = payload;
    const { labels } = kpi.params;

    this.logger.log(labels);

    const issuesSinceRelease: Issue[] = await this.issueService
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
        node_id: { $first: '$node_id' },
        created_at: { $first: '$created_at' },
        closed_at: { $first: '$closed_at' },
        state: { $first: '$state' },
      })
      .exec();

    let allIssuesSinceThisRelease = issuesSinceRelease.length;
    let issuesClosedBeforeThisRelease = 0;
    for (const issue of issuesSinceRelease) {
      if (issue.state === 'closed') {
        if (new Date(issue.closed_at) <= new Date(release.published_at)) {
          issuesClosedBeforeThisRelease += 1;
        }
      }
    }
    console.log('closed issues:');
    console.log(issuesClosedBeforeThisRelease);
    console.log('issues:');
    console.log(allIssuesSinceThisRelease);

    const resolutionRate =
      issuesClosedBeforeThisRelease / allIssuesSinceThisRelease;

    console.log('resolution rate:');
    console.log(resolutionRate);
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: isNaN(resolutionRate) ? {} : resolutionRate,
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
    this.logger.log(resolutionEfficiency);
    resolutionEfficiency = resolutionEfficiency.reduce(
      (resEff: number[], value: number) =>
        isNaN(value) ? resEff : [value, ...resEff],
      [],
    );

    console.log(resolutionEfficiency);
    console.log(resolutionEfficiency.length);
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
