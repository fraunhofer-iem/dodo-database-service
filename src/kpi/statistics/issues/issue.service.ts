import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RepositoryIdentifier } from '../../../entities/repositories/model';
import { RepositoryDocument } from '../../../entities/repositories/model/schemas';
import { msToDateString } from '../developerFocus/lib';

@Injectable()
export class IssueService {
  private readonly logger = new Logger(IssueService.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
  ) {}

  /**
   * Number of issues with no assignees
   */
  async numberOfAssignee(repoIdent: RepositoryIdentifier) {
    const filter = {
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    };

    const getIssuesWithEvents = {
      from: 'issuewithevents',
      localField: 'issuesWithEvents',
      foreignField: '_id',
      as: 'expandedIssuesWithEvents',
    };

    const getIssue = {
      from: 'issues',
      localField: 'expandedIssuesWithEvents.issue',
      foreignField: '_id',
      as: 'expandedIssue',
    };

    const getAssignees = {
      from: 'assignees',
      localField: 'expandedIssue.assignee',
      foreignField: '_id',
      as: 'assigneee',
    };

    const res: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$issuesWithEvents')
      .lookup(getIssuesWithEvents)
      .unwind('$expandedIssuesWithEvents')
      .lookup(getIssue)
      .unwind('$expandedIssue')
      .lookup(getAssignees)
      .unwind('$assigneee')
      .match({ 'assigneee.login': { $exists: false } })
      .exec();

    this.logger.log(`Number of issues with no assignee are ${res.length}.`);
    return res.length;
  }

  /**
   * Calculate the number of open tickets
   * @param repoIdent
   */
  async numberOfOpenTickets(repoIdent: RepositoryIdentifier) {
    const filter = {
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    };

    const getIssuesWithEvents = {
      from: 'issuewithevents',
      localField: 'issuesWithEvents',
      foreignField: '_id',
      as: 'expandedIssuesWithEvents',
    };

    const getIssue = {
      from: 'issues',
      localField: 'expandedIssuesWithEvents.issue',
      foreignField: '_id',
      as: 'expandedIssue',
    };

    const res: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$issuesWithEvents')
      .lookup(getIssuesWithEvents)
      .unwind('$expandedIssuesWithEvents')
      .lookup(getIssue)
      .unwind('$expandedIssue')
      .match({ 'expandedIssue.state': 'open' })
      .exec();
    this.logger.log(`Number of open issues are ${res.length}.`);
    return res.length;
  }

  /**
   * Calculate Avg Number of assignees until the ticket closes
   * Calculations involve only tickets which are closed
   * find the tickets which are closed, if assignees is null count them, if assignees is not null count number of assignees
   * @param repoIdent
   */
  async avgNumberOfAssigneeUntilTicketCloses(repoIdent: RepositoryIdentifier) {
    const filter = {
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    };

    const getIssuesWithEvents = {
      from: 'issuewithevents',
      localField: 'issuesWithEvents',
      foreignField: '_id',
      as: 'expandedIssuesWithEvents',
    };

    const getIssue = {
      from: 'issues',
      localField: 'expandedIssuesWithEvents.issue',
      foreignField: '_id',
      as: 'expandedIssue',
    };

    const getAssignees = {
      from: 'assignees',
      localField: 'expandedIssue.assignee',
      foreignField: '_id',
      as: 'assigneee',
    };

    const res: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$issuesWithEvents')
      .lookup(getIssuesWithEvents)
      .unwind('$expandedIssuesWithEvents')
      .lookup(getIssue)
      .unwind('$expandedIssue')
      .lookup(getAssignees)
      .unwind('$assigneee')
      .match({ 'expandedIssue.state': 'closed' })
      .match({ 'expandedIssue.assignees': { $exists: false } })
      .exec();

    const res1: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$issuesWithEvents')
      .lookup(getIssuesWithEvents)
      .unwind('$expandedIssuesWithEvents')
      .lookup(getIssue)
      .unwind('$expandedIssue')
      .lookup(getAssignees)
      .unwind('$assigneee')
      .match({ 'expandedIssue.state': 'closed' })
      .match({ 'expandedIssue.assignees': { $exists: true } })
      .group({
        _id: null,
        totalsize: { $sum: { $size: '$expandedIssue.assignees' } },
        numberofticket: { $sum: 1 },
      })
      .exec();

    const totalClosedTickets = res.length + res1[0]['numberofticket'];
    const avg = (res.length + res1[0]['totalsize']) / totalClosedTickets;
    this.logger.log(
      `Average number of assignee(s) per ticket until the ticket closes are ${avg}.`,
    );
    return avg;
  }

  /**
   * Calculate average time until ticket was assigned
   * @param repoIdent
   */
  async avgTimeTillTicketWasAssigned(
    repoIdent: RepositoryIdentifier,
    userLimit?: number,
  ) {
    const limit = userLimit ? userLimit : 100;

    const filter = {
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    };

    const getIssuesWithEvents = {
      from: 'issuewithevents',
      localField: 'issuesWithEvents',
      foreignField: '_id',
      as: 'expandedIssuesWithEvents',
    };

    const getIssueEventTypes = {
      from: 'issueeventtypes',
      localField: 'expandedIssuesWithEvents.issueEventTypes',
      foreignField: '_id',
      as: 'expanadedissueEventTypes',
    };

    const getIssue = {
      from: 'issues',
      localField: 'expandedIssuesWithEvents.issue',
      foreignField: '_id',
      as: 'expandedIssue',
    };

    const res: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$issuesWithEvents')
      .lookup(getIssuesWithEvents)
      .unwind('$expandedIssuesWithEvents')
      .lookup(getIssueEventTypes)
      .unwind('$expanadedissueEventTypes')
      .lookup(getIssue)
      .unwind('$expandedIssue')
      .match({ 'expanadedissueEventTypes.event': 'assigned' })
      .addFields({
        _id: null,
        issueCreatedAt: { $toDate: '$expandedIssue.created_at' },
        issueAssignedAt: { $toDate: '$expanadedissueEventTypes.created_at' },
      })
      .addFields({
        _id: null,
        subtractedDate: { $subtract: ['$issueAssignedAt', '$issueCreatedAt'] },
      })
      //we get the subtracted dates till here in milliseconds
      .group({ _id: '$subtractedDate' })
      .group({ _id: null, totaltime: { $avg: '$_id' } })
      .limit(limit)
      .exec();

    const time = msToDateString(res[0]['totaltime']);
    this.logger.log(`Average time until tickets was assigned is ${time}`);
    return time;
  }

  /**
   * to Calculate work in progress.
   * Tickets are assigned to someone and then we count the number of releases
   * that have been made while the ticket was open
   * i.e., (Average) number of releases until we close the ticket.
   * Only tickets which are 'assigned' and tickets whose 'closed_at' key is not null
   * is taken into account.
   * @param repoIdent
   * @param userLimit
   */
  async workInProgress(repoIdent: RepositoryIdentifier, userLimit?: number) {
    const limit = userLimit ? userLimit : 100;

    const filter = {
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    };

    const getIssuesWithEvents = {
      from: 'issuewithevents', // why lowercase?
      localField: 'issuesWithEvents', // have to match
      foreignField: '_id', // have to match
      as: 'expandedIssuesWithEvents',
    };

    const getIssueEventTypes = {
      from: 'issueeventtypes',
      localField: 'expandedIssuesWithEvents.issueEventTypes',
      foreignField: '_id',
      as: 'expandedissueEventTypes',
    };

    const getIssue = {
      from: 'issues',
      localField: 'expandedIssuesWithEvents.issue',
      foreignField: '_id',
      as: 'expandedIssue',
    };

    const getReleases = {
      from: 'releases',
      localField: 'releases',
      foreignField: '_id',
      as: 'expandedReleases',
    };

    // get all issues with object id, creation and closing date
    // only those with closing date and assignee
    // I assume that every assigend issue got the 'assigned' event for the query
    const issues = await this.repoModel
      .aggregate()
      .match(filter)
      .project({ issuesWithEvents: 1 })
      .unwind('$issuesWithEvents')
      .lookup(getIssuesWithEvents)
      .unwind('$expandedIssuesWithEvents')
      .lookup(getIssueEventTypes)
      .unwind('$expandedissueEventTypes')
      .lookup(getIssue)
      .unwind('$expandedIssue')
      .match({ 'expandedissueEventTypes.event': 'assigned' }) // ignore all unassigned issues
      .project({
        'expandedIssue.created_at': 1,
        'expandedIssue.closed_at': 1,
        _id: 0,
      })
      .match({
        'expandedIssue.closed_at': { $ne: null },
      }) // ignore all issues without closing date
      .group({
        _id: {
          created_at: '$expandedIssue.created_at',
          closed_at: '$expandedIssue.closed_at',
        },
      }) // group by id, created_at and closed_at
      .sort({ 'expandedIssue.created_at': 1 }) // sort by created_at ascending
      .limit(limit)
      .exec();

    // get all releases sorted ascending
    const releases: { _id: string }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .project({ releases: 1 })
      .unwind('$releases')
      .lookup(getReleases)
      .unwind('$expandedReleases')
      .group({ _id: '$expandedReleases' })
      .group({ _id: '$_id.published_at' })
      .sort({ _id: 1 })
      .exec();

    const releasesPerIssues = [];
    // store all releases per issue which were released
    // between opening and closing date
    for (const issue of issues) {
      const opening = new Date(issue._id.created_at);
      const closing = new Date(issue._id.closed_at);
      let amount = 0;
      for (const release of releases) {
        const releasing = new Date(release._id);
        if (opening < releasing && releasing < closing) {
          amount += 1;
        } else if (releasing > closing) {
          releasesPerIssues.push(amount);
          break;
        }
      }
    }

    const avg =
      releasesPerIssues.reduce((prevVal, currVal) => prevVal + currVal) /
      issues.length;

    this.logger.log(`avg number of releases per closed issue is ${avg}`);

    return avg;
  }
}
