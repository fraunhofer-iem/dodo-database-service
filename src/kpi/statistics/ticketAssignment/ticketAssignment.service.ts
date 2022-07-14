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
    const { labels } = kpi.params.labels;

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
        assignees: { $first: '$assignees' },
      })
      .exec();

    const assignedIssues: Issue[] = [];
    for (const issue of issues) {
      if (issue.assignee || issue.assignees.length) {
        assignedIssues.push(issue);
      }
    }

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: assignedIssues.length / issues.length,
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
}
