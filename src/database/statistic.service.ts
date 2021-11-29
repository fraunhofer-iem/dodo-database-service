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
import { timestamp } from 'rxjs';

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

    //  this.logger.log(`Closed Tickets with only a single assignee ${res.length}.`);

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
    //console.log(res[0]['totaltime']);
    const time = msToTime(res[0]['totaltime']);
    this.logger.log(`Average time until tickets was assigned is ${time}`);
    return time;

    //function to convert ms to hour/minutes/seconds
    function msToTime(ms: number) {
      const seconds = ms / 1000;
      const minutes = ms / (1000 * 60);
      const hours = ms / (1000 * 60 * 60);
      const days = ms / (1000 * 60 * 60 * 24);
      if (seconds < 60) return seconds.toFixed(1) + ' Sec';
      else if (minutes < 60) return minutes.toFixed(1) + ' Min';
      else if (hours < 24) return hours.toFixed(1) + ' Hrs';
      else return days + ' Days';
    }
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

  async getRepoCommits(repoId: string, userLimit?: number) {
    const limit = userLimit ? userLimit : 100;

    const getCommits = {
      from: 'commits',
      localField: 'commits', // have to match
      foreignField: '_id', // have to match
      as: 'expandedCommits',
    };

    const commits: { expandedCommits: { login: string; timestamp: string } }[] =
      await this.repoModel
        .aggregate()
        .match({ _id: repoId })
        .project({ commits: 1 })
        .unwind('$commits')
        .lookup(getCommits)
        .unwind('$expandedCommits')
        .project({
          'expandedCommits.login': 1,
          'expandedCommits.timestamp': 1,
          _id: 0,
        })
        .sort({ 'expandedCommits.timestamp': 1 })
        .exec();

    // console.log(commits);

    const commit_arr: { login: string; timestamp: string }[] = [];
    commits.forEach((commit) => {
      commit_arr.push({
        login: commit.expandedCommits.login,
        timestamp: commit.expandedCommits.timestamp,
      });
    });

    // console.log(commit_arr);

    // group by developer
    // acc is empty object which will group the objects
    const developers = commit_arr.reduce((acc, obj) => {
      var key = obj['login'];
      if (!acc[key]) {
        acc[key] = [];
      }
      var date = obj.timestamp.slice(0, 10);
      if (!acc[key].includes(date)) {
        acc[key].push(date);
      }
      return acc;
    }, {});

    // console.log(developers);
    return developers;
  }

  async devSpread(owner: string, timespread?: string) {
    const timeslot = timespread ? timespread : 'day';

    const repoIds = await this.repoModel
      .aggregate()
      .match({ owner: owner })
      .project({ _id: 1 })
      .exec();

    const repoDevelopers = [];
    const developerSet: Set<string> = new Set();
    for (const repoId of repoIds) {
      console.log(repoId);
      const developers = await this.getRepoCommits(repoId._id);
      repoDevelopers.push(developers);
      for (const dev of Object.keys(developers)) {
        developerSet.add(dev);
      }
    }
    console.log(repoDevelopers);
    console.log(developerSet);

    // get the devSpread
    const spread = {};
    for (const dev of developerSet) {
      var allDevCommits: string[] = [];
      var repoCount = 0;
      for (const repo of repoDevelopers) {
        if (dev in repo) {
          repoCount += 1;
          allDevCommits.push(...repo[dev]); // syntax?
        }
      }
      console.log(allDevCommits);
      spread[dev] = {
        repos: repoCount,
        spread: allDevCommits.reduce((acc, curr) => {
          return acc[curr] ? ++acc[curr] : (acc[curr] = 1), acc;
        }, {}),
      };
      console.log(spread);
    }

    // calculate day, week, sprint, month spread avg
    const spreadsPerDevs = {};
    for (const dev of Object.keys(spread)) {
      const timestamps: string[] = Object.keys(spread[dev].spread).sort();
      console.log(timestamps);
      const end = timestamps[-1];
      var weekDate = timestamps[0];
      var sprintDate = timestamps[0];
      var monthDate = timestamps[0];
      var spreads = spread[dev].spread[timestamps[0]]; // initial value for days always
      var week = 0;
      var sprint = 0;
      var month = 0;
      for (let i = 1; i < timestamps.length; i++) {
        const value = spread[dev].spread[timestamps[i]];
        spreads += value;
        if (addDays(weekDate, 7) < new Date(timestamps[i])) {
          week += value;
          weekDate = timestamps[i];
        }
        if (addDays(sprintDate, 14) < new Date(timestamps[i])) {
          sprint += value;
          sprintDate = timestamps[i];
        }
        if (addDays(monthDate, 30) < new Date(timestamps[i])) {
          month += value;
          monthDate = timestamps[i];
        }
      }
      spreadsPerDevs[dev] = {
        spread: spreads,
        days: timestamps.length,
        weeks: week,
        sprints: sprint,
        months: month,
      };
    }

    console.log(spreadsPerDevs);
    // avg spread per dev
    for (const dev of Object.keys(spreadsPerDevs)) {
      const devObj = spreadsPerDevs[dev];
      devObj.daySpread = devObj.spread / devObj.days;
      if (devObj.weeks != 0) {
        devObj.weekSpread = devObj.spread / devObj.weeks;
      }
      if (devObj.sprints != 0) {
        devObj.sprintSpread = devObj.spread / devObj.sprints;
      }
      if (devObj.months != 0) {
        devObj.monthSpread = devObj.spread / devObj.months;
      }
    }

    console.log(spreadsPerDevs);

    // avg spread per orga
    const totalSpread = {
      daySpread: 0,
      weekSpread: 0,
      sprintSpread: 0,
      monthSpread: 0,
    };
    for (const dev of Object.keys(spreadsPerDevs)) {
      const devObj = spreadsPerDevs[dev];
      totalSpread.daySpread += devObj.daySpread;
      totalSpread.weekSpread += devObj.weekSpread;
      totalSpread.sprintSpread += devObj.sprintSpread;
      totalSpread.monthSpread += devObj.monthSpread;
    }
    totalSpread.daySpread += totalSpread.daySpread / developerSet.size;
    totalSpread.weekSpread += totalSpread.weekSpread / developerSet.size;
    totalSpread.sprintSpread += totalSpread.sprintSpread / developerSet.size;
    totalSpread.monthSpread += totalSpread.monthSpread / developerSet.size;

    console.log(totalSpread);

    // how to interpret week, sprint, month avg spread?
    // maybe additionally just count the spreads, i.e. if there is a spread,
    // count him, no matter if its 2,3,4 ... repos. All which is not 1 is counted.

    // check if value is greater equals 1, otherwise there is no
    // week, sprint or month => give the number per time unit
    // which show the normal case without any spread (i.e. days/time unit)

    function addDays(date: string, days: number) {
      var result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }
  }
}
