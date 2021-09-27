import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RepositoryNameDto } from 'src/github-api/model/Repository';
import { DiffDocument } from './schemas/diff.schema';
import { PullRequestDocument } from './schemas/pullRequest.schema';
import { PullRequestFileDocument } from './schemas/pullRequestFile.schema';
import { RepositoryDocument } from './schemas/repository.schema';
import { RepositoryFileDocument } from './schemas/repositoryFile.schema';
import { IssueDocument } from './schemas/issue.schema';
import { IssueEventTypesDocument } from './schemas/issueEventTypes.schema';
import { IssueWithEventsDocument } from './schemas/issueWithEvents.schema';
import { LabelDocument } from './schemas/labels.schema';
import { AssigneeDocument } from './schemas/assignee.schema';
import { AssigneesDocument } from './schemas/assignees.schema';
import { MilestoneDocument } from './schemas/milestone.schema';

@Injectable()
export class StatisticService {
  private readonly logger = new Logger(StatisticService.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
    @InjectModel('RepositoryFiles')
    private readonly repoFileModel: Model<RepositoryFileDocument>,
    @InjectModel('PullRequestFiles')
    private readonly pullFileModel: Model<PullRequestFileDocument>,
    @InjectModel('PullRequest')
    private readonly pullRequestModel: Model<PullRequestDocument>,
    @InjectModel('Diff')
    private readonly diffModel: Model<DiffDocument>,
    @InjectModel('Issue')
    private readonly issueModel: Model<IssueDocument>,
    @InjectModel('IssueEventTypes')
    private readonly issueEventTypesModel: Model<IssueEventTypesDocument>,
    @InjectModel('IssueWithEvents')
    private readonly issueWithEventsModel: Model<IssueWithEventsDocument>,
    @InjectModel('Label')
    private readonly labelModel: Model<LabelDocument>,
    @InjectModel('Assignee')
    private readonly assigneeModel: Model<AssigneeDocument>,
    @InjectModel('Assignees')
    private readonly assigneesModel: Model<AssigneesDocument>,
    @InjectModel('Milestone')
    private readonly milestoneModel: Model<MilestoneDocument>,
  ) {}

  /**
   *
   * @param repoIdent
   * @param limit a maximum of 100 files is returned
   */
  async getMostChangedFiles(repoIdent: RepositoryNameDto, userLimit?: number) {
    const limit = userLimit ? userLimit : 100;
    this.logger.log(
      `getting the ${limit} most changed files for ${repoIdent.owner}/${repoIdent.repo}`,
    );
    const filter = {
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    };

    const group = {
      _id: '$pullFiles.filename',
      count: { $sum: 1 },
    };

    const getDiffs = {
      from: 'diffs',
      localField: 'diffs',
      foreignField: '_id',
      as: 'expandedDiffs',
    };

    const getPullFiles = {
      from: 'pullrequestfiles',
      localField: 'expandedDiffs.pullRequestFiles',
      foreignField: '_id',
      as: 'pullFiles',
    };

    const res: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$diffs')
      .lookup(getDiffs)
      .lookup(getPullFiles)
      .unwind('$pullFiles')
      .group(group)
      .sort({ count: -1 })
      .limit(limit)
      .exec();
    let avg = 0;
    res.forEach((e) => {
      // this.logger.debug(e);
      avg += e.count;
    });

    avg = avg / res.length;
    this.logger.log(
      `Calculation of most changed files for ${repoIdent.owner}/${repoIdent.repo} finished. Retrieved ${res.length} files. Average changes to the first files: ${avg}`,
    );
  }
  /**
   * This method gives the count of the filenames that are changed together
   * E.g.
   * 1. pullRequestFiles: [File A, File B, File C, File D]
   * 2. pullRequestFiles: [File A, File B, File E, File F]
   * 3. pullRequestFiles: [File A, File B, File X, File Y]
   * 4. pullRequestFiles: [File C, File D, File Z]
   * output: Files A & B changed together 3 times
   * @param repoIdent
   * @param userLimit
   */
  async getFilesChangedTogether(repoIdent: RepositoryNameDto) {
    const filter = {
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    };

    const group = {
      _id: null,
      count: { $count: {} },
    };

    const getDiffs = {
      from: 'diffs',
      localField: 'diffs',
      foreignField: '_id',
      as: 'expandedDiffs',
    };

    const getPullFiles = {
      from: 'pullrequestfiles',
      localField: 'expandedDiffs.pullRequestFiles',
      foreignField: '_id',
      as: 'pullFiles',
    };

    //enter file name here
    const file1 = ['package.json'];
    const file2 = ['package-lock.json'];
    const getFilesNames = {
      $and: [
        { 'pullFiles.filename': { $in: file1 } },
        { 'pullFiles.filename': { $in: file2 } },
      ],
    };

    const res: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$diffs')
      .lookup(getDiffs)
      .lookup(getPullFiles)
      .match(getFilesNames)
      .exec();

    this.logger.log(
      `The files ${file1} & ${file2} are repeatedly changed together ${res.length} times.`,
    );
  }

  /**
   * Calculate the change in the pullrequests
   * @param repoIdent
   * @param userLimit
   */
  async sizeOfPullRequest(repoIdent: RepositoryNameDto, userLimit?: number) {
    const limit = userLimit ? userLimit : 100;
    this.logger.log(
      `getting the ${limit} most changed files for ${repoIdent.owner}/${repoIdent.repo}`,
    );
    const filter = {
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    };

    const group = {
      _id: '$pullFiles.filename',
      count: { $sum: 1 },
    };

    const getDiffs = {
      from: 'diffs',
      localField: 'diffs',
      foreignField: '_id',
      as: 'expandedDiffs',
    };

    const getPullRequests = {
      from: 'pullrequests',
      localField: 'expandedDiffs.pullRequest',
      foreignField: '_id',
      as: 'pullRequests',
    };

    const getPullRequestNumber = {
      _id: '$pullRequests.number',
    };

    const res: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$diffs')
      .lookup(getDiffs)
      .lookup(getPullRequests)
      .group(getPullRequestNumber)
      .sort({ _id: 1 })
      .exec();

    const fileNumber = [];
    res.forEach((e) => {
      fileNumber.push(parseInt(e._id));
    });
    const v1 = fileNumber[0];
    const v2 = fileNumber[fileNumber.length - 1];
    const difference = v2 - v1;

    console.log(v1, v2, typeof v2);
    const percent = (difference / Math.abs(v1)) * 100;

    let change;
    if (percent < 0) change = 'decrease';
    else change = 'increase';

    this.logger.log(
      `There is a ${percent} % change or ${Math.abs(
        percent,
      )} % ${change} in the size of pull requests.`,
    );
  }

  /**
   * Number of issues with no assignees
   */
  async numberOfAssignee(repoIdent: RepositoryNameDto) {
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

    const getPull_requests = {
      from: 'pull_requests',
      localField: 'expandedIssue.pull_request',
      foreignField: '_id',
      as: 'pullRequestss',
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
      .lookup(getPull_requests)
      .unwind('$pullRequestss')
      .lookup(getAssignees)
      .unwind('$assigneee')
      .match({ 'pullRequestss.url': { $exists: false } })
      .match({ 'assigneee.login': { $exists: false } })
      .exec();
    this.logger.log(`Number of issues with no assignee are ${res.length}.`);
  }

  /**
   * Calculate the number of open tickets
   * @param repoIdent
   */
  async numberOfOpenTickets(repoIdent: RepositoryNameDto) {
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

    const getPull_requests = {
      from: 'pull_requests',
      localField: 'expandedIssue.pull_request',
      foreignField: '_id',
      as: 'pullRequestss',
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
      .lookup(getPull_requests)
      .unwind('$pullRequestss')
      .lookup(getAssignees)
      .unwind('$assigneee')
      .match({ 'pullRequestss.url': { $exists: false } })
      .match({ 'expandedIssue.state': 'open' })
      .exec();
    this.logger.log(`Number of open issues are ${res.length}.`);
  }

  /**
   * Calculate Avg Number of assignees until the ticket closes
   * Calculations involve only tickets which are closed
   * find the tickets which are closed, if assignees is null count them, if assignees is not null count number of assignees
   * @param repoIdent
   */
  async avgNumberOfAssigneeUntilTicketCloses(repoIdent: RepositoryNameDto) {
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

    const getPull_requests = {
      from: 'pull_requests',
      localField: 'expandedIssue.pull_request',
      foreignField: '_id',
      as: 'pullRequestss',
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
      .lookup(getPull_requests)
      .unwind('$pullRequestss')
      .lookup(getAssignees)
      .unwind('$assigneee')
      .match({ 'pullRequestss.url': { $exists: false } })
      .match({ 'expandedIssue.state': 'closed' })
      .match({ 'expandedIssue.assignees': { $exists: false } })
      .exec();

    //  this.logger.log(`Closed Tickets with only a single assignee ${res.length}.`);

    const res1: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$issuesWithEvents')
      .lookup(getIssuesWithEvents)
      .unwind('$expandedIssuesWithEvents')
      .lookup(getIssue)
      .unwind('$expandedIssue')
      .lookup(getPull_requests)
      .unwind('$pullRequestss')
      .lookup(getAssignees)
      .unwind('$assigneee')
      .match({ 'pullRequestss.url': { $exists: false } })
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
  }

  /**
   * Calculate average time until ticket was assigned
   * @param repoIdent
   */
  async avgTimeTillTicketWasAssigned(
    repoIdent: RepositoryNameDto,
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
      .match({ 'expanadedissueEventTypes.event': 'labeled' })
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
      .group({ _id: null, totaltime: { $sum: '$_id' } })
      .limit(limit)
      .exec();

    const time = msToTime(res[0]['totaltime']);
    this.logger.log(`Average time until tickets was assigned is ${time}`);

    //function to convert ms to hour/minutes/seconds
    function msToTime(ms) {
      let seconds, minutes, hours, days;
      seconds = (ms / 1000).toFixed(1);
      minutes = (ms / (1000 * 60)).toFixed(1);
      hours = (ms / (1000 * 60 * 60)).toFixed(1);
      days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
      if (seconds < 60) return seconds + ' Sec';
      else if (minutes < 60) return minutes + ' Min';
      else if (hours < 24) return hours + ' Hrs';
      else return days + ' Days';
    }
  }
}
