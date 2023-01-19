import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { sum } from 'lodash';
import { Issue } from 'src/entities/issues/model/schemas';
import { IssueService } from '../../../entities/issues/issue.service';
import { CalculationEventPayload } from '../lib';

@Injectable()
export class TicketAssignmentService {
  private readonly logger = new Logger(TicketAssignmentService.name);

  constructor(
    private readonly issueService: IssueService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('kpi.prepared.unassignedTicketRate')
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
        assignee: { $first: '$assignee' },
        assignees: { $push: '$assignees' },
      })
      .exec();

    const assignedIssues: Issue[] = [];
    for (const issue of issues) {
      console.log(issue);
      if (issue.assignee !== null) {
        assignedIssues.push(issue);
      }
    }

    // the lower, the better
    const unassignedTicketRate = 1 - assignedIssues.length / issues.length;
    console.log(unassignedTicketRate);
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: isNaN(unassignedTicketRate) ? {} : unassignedTicketRate,
    });
  }

  @OnEvent('kpi.prepared.overallUnassignedTicketRate')
  public async overallUnassignedTicketRate(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    let { unassignedTicketRate } = data;
    unassignedTicketRate = unassignedTicketRate.reduce(
      (unassignedRate: number[], value: number) =>
        isNaN(value) ? unassignedRate : [value, ...unassignedRate],
      [],
    );

    const overallUnassignedTicketRate =
      sum(unassignedTicketRate) / unassignedTicketRate.length;
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: overallUnassignedTicketRate,
    });
  }

  @OnEvent('kpi.prepared.overallWorkInProgress')
  public async workInProgress(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { overallResolutionRate, overallUnassignedTicketRate } = data;

    // assignedTickets / notResolvedTickets
    let overallWorkInProgress =
      (1 - overallUnassignedTicketRate) / (1 - overallResolutionRate);

    if (overallWorkInProgress > 1) {
      overallWorkInProgress = 1;
    }

    // zero: no assigned tickets at all, wip is very high - bad
    // NaN: nothing left to resolve, no wip at all - should be 1, i.e. good
    // > one: much assigned, less to solve - good
    // one: relation of assigned and not resolved is the same - 5 tickets assigend, 5 not resolved, all good
    // tries to identify
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: isNaN(overallWorkInProgress) ? 1 : overallWorkInProgress,
    });
  }
}
