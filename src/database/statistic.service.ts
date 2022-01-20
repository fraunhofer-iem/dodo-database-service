import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RepositoryNameDto } from 'src/github-api/model/Repository';
import { RepositoryDocument } from './schemas/repository.schema';
import { msToDateString } from './statistics/dateUtil';

@Injectable()
export class StatisticService {
  private readonly logger = new Logger(StatisticService.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
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
      .sort({ count: -1 }) //sort reverted
      .limit(limit)
      .exec();

    let avg = 0;
    res.forEach((e) => {
      avg += e.count;
    });
    avg = avg / res.length;
    this.logger.log(
      `Calculation of most changed files for ${repoIdent.owner}/${repoIdent.repo} finished. Retrieved ${res.length} files. Average changes to the first files: ${avg}`,
    );

    return avg;
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

    // TODO: we need to do this for all files
    // most likely it would be a good idea to iterate
    // all diffs once, and create a map/counter of which
    // files occured together
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
    return res.length;
  }

  /**
   * Calculate the change in the pullrequests
   * @param repoIdent
   * @param userLimit
   */
  async sizeOfPullRequest(repoIdent: RepositoryNameDto, userLimit?: number) {
    const filter = {
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    };

    const getPullRequest = {
      from: 'pullrequests',
      localField: 'expandedDiffs.pullRequest',
      foreignField: '_id',
      as: 'expandedPullRequest',
    };

    const getDiffs = {
      from: 'diffs',
      localField: 'diffs',
      foreignField: '_id',
      as: 'expandedDiffs',
    };

    // we query the ids of the changed files (this is enough, because we just want to count the number)
    // as well as the pull request number to sort the files and label them in the visualization
    const res: {
      _id: string;
      changedFiles: string[];
      pullRequestNumber: number;
    }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$diffs')
      .lookup(getDiffs)
      .lookup(getPullRequest)
      .unwind('$expandedDiffs')
      .unwind('$expandedPullRequest')
      .project({
        changedFiles: '$expandedDiffs.pullRequestFiles',
        pullRequestNumber: '$expandedPullRequest.number',
      })
      .sort({ pullRequestNumber: 1 })
      .exec();

    const numberOfFiles = [];

    res.forEach((e) => {
      // somehow there exist pull requests without changed files. need to investigate
      if ('changedFiles' in e) {
        numberOfFiles.push(e.changedFiles.length);
      }
    });

    const numberOfElements = numberOfFiles.length;
    const avg =
      numberOfFiles.reduce((acc, curr) => {
        return acc + curr;
      }, 0) / numberOfElements;

    const variance = numberOfFiles.reduce((acc, curr) => {
      return acc + Math.pow(curr - avg, 2) / numberOfElements;
    }, 0);

    const standardDeviation = Math.sqrt(variance);
    this.logger.log(
      `variance ${variance} standard deviation ${standardDeviation}`,
    );
    this.logger.log(
      `In average ${avg} files are changed with each pull request`,
    );

    return {
      numberOfFiles,
      avg,
      variance,
      standardDeviation,
    };
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
  async workInProgress(repoIdent: RepositoryNameDto, userLimit?: number) {
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

  /**
   * The Time to Resolution describes the development team's capability to respond to bug reports. It assesses the time it took to resolve a single bug report.
   * We calculate this information point for resolved issues labeled bug (or some other equivalent label).
   * (issue[label = "bug", state="closed"], T_bugfix) => {
   * return (issue.closed_at - issue.created_at)
   *  }
   *  @param repoIdent
   *  @param labelName
   *  @param userLimit
   */
  async timeToResolution(
    repoIdent: RepositoryNameDto,
    labelName?: string,
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

    const getLabel = {
      from: 'labels',
      localField: 'expandedIssue.label',
      foreignField: '_id',
      as: 'expandedLabels',
    };

    const res: { _id: string; avg: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .project({ issuesWithEvents: 1 })
      .unwind('$issuesWithEvents')
      .lookup(getIssuesWithEvents)
      .unwind('$expandedIssuesWithEvents')
      .lookup(getIssue)
      .unwind('$expandedIssue')
      // TODO: for now we ignore the labels and calculate the time for every ticket regardless of the label
      // .lookup(getLabel)
      // .unwind('$expandedLabels')
      // .match({ 'expandedLabels.name': { $exists: true, $eq: 'bug' } })
      .match({ 'expandedIssue.closed_at': { $exists: true, $ne: null } })
      .project({
        issueCreatedAtTime: { $toDate: '$expandedIssue.created_at' },
        issueClosedAtTime: { $toDate: '$expandedIssue.closed_at' },
      })
      .addFields({
        subtractedDate: {
          $subtract: ['$issueClosedAtTime', '$issueCreatedAtTime'],
        },
      })
      .group({
        _id: '$_id',
        avg: { $avg: '$subtractedDate' },
      })
      .exec();

    this.logger.log(
      `average time to resolution for each ticket is ${msToDateString(
        res[0].avg,
      )}`,
    );

    return res;
  }

  /**
   *  The Fault Correction Efficiency describes the development team's capability to respond to bug reports.
   *  In more detail, it assesses if a single fault was corrected within the time frame the organization aims to adhere to for fault corrections.
   *  We calculate this qualitative indicator for resolved issues labeled bug (or some other equivalent label).
   *  A value greater than 1 indicates that the fault was not corrected within the desired time.
   *  A value less than 1 indicates that the fault was corrected within the desired time.
   *
   *  (issue[label = "bug", state="closed"], T_bugfix) => {
   *  return (issue.closed_at - issue.created_at) / T_bugfix
   *   }
   *  @param repoIdent
   *  @param userLimit
   */
  async faultCorrectionEfficiency(
    repoIdent: RepositoryNameDto,
    userLimit?: number,
    timeFrame?: number,
  ) {
    const limit = userLimit ? userLimit : 100;
    // This variable defines the fixed time set for the bugs to be resolved.
    // Since such an information cannot be derived from git (milestones can be looked at,
    // however they are hardly properly utilized by most projects).
    // Although information like this can be derived from Jira, but for now, it is manually defined.
    // duration value is considered to be 14 Days, i.e, 1209600000 ms.
    const duration = timeFrame ? timeFrame : 1209600000;

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

    const getLabel = {
      from: 'labels',
      localField: 'expandedIssue.label',
      foreignField: '_id',
      as: 'expandedLabels',
    };

    const res: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .project({ issuesWithEvents: 1 })
      .unwind('$issuesWithEvents')
      .lookup(getIssuesWithEvents)
      .unwind('$expandedIssuesWithEvents')
      .lookup(getIssue)
      .unwind('$expandedIssue')
      .lookup(getLabel)
      .unwind('$expandedLabels')
      // .match({ 'expandedLabels.name': { $exists: true, $eq: 'bug' } })
      // .match({ 'expandedIssue.closed_at': { $exists: true, $ne: null } })
      .project({
        Issue_created_at_Time: { $toDate: '$expandedIssue.created_at' },
        Issue_closed_at_Time: { $toDate: '$expandedIssue.closed_at' },
      })
      .addFields({
        _id: null,
        subtractedDate: {
          $subtract: ['$Issue_closed_at_Time', '$Issue_created_at_Time'],
        },
      })
      .exec();

    const inTime = res.reduce((prev, curr) => {
      if (this.wasCorrectedInTime(curr['subtractedDate'], duration)) {
        return prev + 1;
      } else {
        return prev;
      }
    }, 0);
    console.log(inTime);

    //prints the Fault correction efficiency for each element.
    this.logger.log(
      `${inTime} of ${res.length} tickets were corrected in ${msToDateString(
        duration,
      )} `,
    );
    return { noInTime: inTime, total: res.length };
  }

  wasCorrectedInTime(time: number, maximumDuration: number): boolean {
    return time > maximumDuration;
  }

  /**
    * The Feature Completion Capability describes the development team's capability to add features to the project.
    * In more detail, it assesses the rate of features completed within the time frame the organization aims to adhere to for feature completion.
    * For this qualitative indicator we take all issues labeled enhancement (or some other equivalent label) into consideration that have been resolved since the previous release.
    * 
    * (release, issues[label = "enhancement", state = "closed"], T_feature) => {
    * features = [ feature for feature in issues 
    *              if feature.closed_at <= release.created_at and 
    *                 feature.closed_at >= release.previous().created_at ]
    * 
    * features_completed_in_time = [ feature for feature in features
    *                                if feature.closed_at - feature.created_at <= T_feature ]
    * 
    * return |features_completed_in_time| / | features | 
    * }
    * @param repoIdent 
    * @param userLimit 
    * @returns 
    */
   async featureCompletionCapability(
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

    const getLabel = {
      from: 'labels',
      localField: 'expandedIssue.label',
      foreignField: '_id',
      as: 'expandedLabels',
    };

    //to obtain releases, sorted on the basis of created_at time
    const res: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$releases')
      .lookup(getReleases)
      .unwind('$expandedReleases')
      .sort({ 'expandedReleases.created_at': 1 })
      //.limit(limit)
      .exec();

    //to obtain closed issues, sorted on the basis of closed_at time and label = enhancement
    const res1: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$issuesWithEvents')
      .lookup(getIssuesWithEvents)
      .unwind('$expandedIssuesWithEvents')
      .lookup(getIssue)
      .unwind('$expandedIssue')
      .lookup(getLabel)
      .unwind('$expandedLabels')
      .match({'expandedLabels.name': {$exists: true, $eq: 'enhancement'}})
      .match({ 'expandedIssue.closed_at': { $exists: true, $ne: null } })
      .sort({ 'expandedIssue.closed_at': 1 })
      //.limit(limit)
      .exec();

    // This variable defines the fixed time set for the feature to be resolved.
    //this info is manually defined
    // T_feature value is considered to be 14 Days, i.e, 1209600000 ms.
    var T_feature = 604800000; //1209600000 (14 days) ;

    var feature_closedAt = [],
        feature_createdAt = [],
        feature = 0;
    for (let i = 0; i < res1.length; i++) {
      for (let j = 1; j < res.length; j++) {
        if (
          res1[i]['expandedIssue']['closed_at'] <=
          res[j]['expandedReleases']['created_at']
        ) {
          if (
            res1[i]['expandedIssue']['closed_at'] >=
            res[j - 1]['expandedReleases']['created_at']
          ) {
            feature_closedAt.push(res1[i]['expandedIssue']['closed_at']);
            feature_createdAt.push(res1[i]['expandedIssue']['created_at']);
            feature += 1;
          }
        }
      }
    }

    var feature_corrected_in_time = 0;
    for (let k = 0; k < feature_closedAt.length; k++) {
      var start = new Date(feature_createdAt[k]).getTime();
      var end = new Date(feature_closedAt[k]).getTime();
      var difference = Math.abs(end - start);
      if (difference <= T_feature) {
        feature_corrected_in_time += 1;
      }
    }
    var feature_completion_capability = Math.abs(feature_corrected_in_time) / Math.abs(feature);
    this.logger.log(
      `Feature Completion Capability is: ${feature_completion_capability}`,
    );
    return feature_completion_capability;
  }
}
