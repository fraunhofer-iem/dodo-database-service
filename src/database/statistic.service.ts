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
import { stringify } from 'querystring';

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

  /**
   * Helper function to query all commmits of a given repo
   * from the db (login, timestamp). It returns
   * all timestamps grouped by developer login or all
   * developers grouped by timestamps, based on
   * the groupBy parameter.
   * @param repoId The _id of the repository model
   * @param groupBy {'developers' | 'timestamps'}
   * @param userLimit not currently used
   * @returns Either {login1: [timestamp1, timestamp2, ...], login2: [timestamp1, timestamp2], ...}
   * or {timestamp1: [dev1, dev2, ...], timestamp2: [dev1, dev2, ...], ...}
   */
  async getRepoCommits(repoId: string, groupBy: string, userLimit?: number) {
    const limit = userLimit ? userLimit : 100; // do we need a limit?

    const getCommits = {
      from: 'commits',
      localField: 'commits',
      foreignField: '_id',
      as: 'expandedCommits',
    };

    // get all commits for the repo
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
        .sort({ 'expandedCommits.timestamp': 1 }) // sorted ascending
        .exec();

    // create array for grouping the values
    const commit_arr: { login: string; timestamp: string }[] = [];
    commits.forEach((commit) => {
      commit_arr.push({
        login: commit.expandedCommits.login,
        timestamp: commit.expandedCommits.timestamp,
      });
    });

    // group by commit
    const timestamps: { [key: string]: [string] } = commit_arr.reduce(
      (acc, obj) => {
        const key = obj.timestamp.slice(0, 10); // we only use the date, not the time
        if (!acc[key]) {
          // new timestamp key, if it does not exist yet
          acc[key] = [];
        }
        const login = obj.login;
        if (!acc[key].includes(login)) {
          // no duplicate logins
          acc[key].push(login);
        }
        return acc;
      },
      {},
    );

    // group by developer
    const developers: { [key: string]: [string] } = commit_arr.reduce(
      (acc, obj) => {
        const key = obj.login;
        if (!acc[key]) {
          // new login key, if it does not exist yet
          acc[key] = [];
        }
        const date = obj.timestamp.slice(0, 10); // we only use the date, not the time
        if (!acc[key].includes(date)) {
          // no duplicate timestamps
          acc[key].push(date);
        }
        return acc;
      },
      {},
    );

    // groupBy parameter
    if (groupBy == 'developers') {
      return developers;
    }
    if (groupBy == 'timestamps') {
      return timestamps;
    }
  }

  /**
   * Calculates the total developer spread for an organisation.
   * It gather all developer commits for all repos of an organisation,
   * which are already stored in the db. Therefor, it checks for every developer,
   * if he has any other commit at the same date in another repo.
   * Example: login1: {spread: {timestamp1: 1, timestamp2: 2, timestamp3: 3}}
   * means that developer 'login1' has no spread on 'timestamp1'
   * (i.e. value 1, because he only commited in 1 repo there),
   * a spread of 2 at 'timestamp2', because he commited in 2 different
   * repos on the same date, and a spread of 3 at 'timestamp3' and so on.
   * After that calculation, timeslots of days, weeks, sprints (two weeks)
   * and months are being calculated and avarages are being calculated.
   * @param owner The organisation whose dev spread should be analysed
   * @param devSpread {true | false} --> if true, the dev spread per developer
   * is returned, and not the avaraged total for all devs of the orga.
   * @returns The total day, week, sprint, month spread avg of the orga
   * in comparison of the avg commits/timslot ratio if there would be
   * no spread at all
   */
  async devSpreadTotal(owner: string, devSpread?: boolean) {
    // get all repo ids of the orga (which are already in the db)
    const repoIds = await this.repoModel
      .aggregate()
      .match({ owner: owner })
      .project({ _id: 1 })
      .exec();

    // store all repo commit objects (grouped by developer) in one array
    const repoDevelopers: { [key: string]: [string] }[] = [];
    const developerSet: Set<string> = new Set(); // store all unique developers
    for (const repoId of repoIds) {
      const developers = await this.getRepoCommits(repoId._id, 'developers');
      repoDevelopers.push(developers);
      for (const dev of Object.keys(developers)) {
        developerSet.add(dev);
      }
    }
    console.log(repoDevelopers);
    console.log(developerSet);

    // get the devSpread, grouped by developers
    const spread: {
      [key: string]: { spread: { [key: string]: number }; repos: number };
    } = {};
    for (const dev of developerSet) {
      const allDevCommits: string[] = []; // store all timestamps here
      let repoCount = 0; // store number of repos the developer has committed (i.e. the max of the spread)
      for (const repo of repoDevelopers) {
        if (dev in repo) {
          repoCount += 1;
          allDevCommits.push(...repo[dev]); // concat every timestamps arr of that dev for every repo
        }
      }
      spread[dev] = {
        repos: repoCount,
        // create spread object with no duplicates --> {timestamp: spread}
        spread: allDevCommits.reduce((acc, curr) => {
          return acc[curr] ? ++acc[curr] : (acc[curr] = 1), acc;
        }, {}),
      };
    }
    console.log(spread);

    // calculate day, week, sprint, month spread avg
    // this is to get all the timeslots more or less precisely
    // to do the further calculation on them
    // why don't take the difference between last and first date
    // and calculate the timeslots of that?
    // imagine a developer who has these commit timestamps:
    // [01.01.21, 01.02.21, 01.03.21, 01.06.21] --> would calculate 6 month,
    // but it's actually 4
    // currently, there is no rounding (almost 3 months calculated as 2, but weeks are accurate)
    // but the compare value will highlight difference!
    // compare values are number of commits without any spread / time unit
    // days <--> commits without any spread
    const spreadsPerDevs: {
      [key: string]: {
        spread: number;
        days: number;
        weeks: number;
        sprints: number;
        months: number;
        daySpread?: number;
        weekSpread?: number;
        sprintSpread?: number;
        monthSpread?: number;
        dayPerfect?: number;
        weekPerfect?: number;
        sprintPerfect?: number;
        monthPerfect?: number;
      };
    } = {};
    for (const dev of Object.keys(spread)) {
      const timestamps: string[] = Object.keys(spread[dev].spread).sort(); // all sorted timestamps of one dev
      // init all with the first timestamp
      let weekDate = timestamps[0];
      let sprintDate = timestamps[0];
      let monthDate = timestamps[0];
      let spreads = spread[dev].spread[timestamps[0]]; // initial value for spreads always the first timestamps spread
      // counter for the timeslots
      let week = 0;
      let sprint = 0;
      let month = 0;
      // always compare the next date; if the interval fits, increase
      for (let i = 1; i < timestamps.length; i++) {
        const value = spread[dev].spread[timestamps[i]];
        spreads += value;
        if (addDays(weekDate, 7) <= new Date(timestamps[i])) {
          week += 1;
          weekDate = timestamps[i];
        }
        if (addDays(sprintDate, 14) <= new Date(timestamps[i])) {
          sprint += 1;
          sprintDate = timestamps[i];
        }
        if (addDays(monthDate, 30) <= new Date(timestamps[i])) {
          month += 1;
          monthDate = timestamps[i];
        }
      }
      spreadsPerDevs[dev] = {
        spread: spreads, // all commit of the dev for whole orga
        days: timestamps.length, // days can be considered as all commits for whole orga if there was no spread
        weeks: week, // counted weeks
        sprints: sprint, // counted sprints
        months: month, // counted months
      };
    }

    console.log(spreadsPerDevs);

    // avg spread per dev; divide total spread amount trough days, weeks, ...
    for (const dev of Object.keys(spreadsPerDevs)) {
      const devObj = spreadsPerDevs[dev];
      devObj['daySpread'] = devObj.spread / devObj.days;
      devObj['dayPerfect'] = 1;
      // if there are no weeks accumulated, skip that
      if (devObj.weeks != 0) {
        devObj['weekSpread'] = devObj.spread / devObj.weeks;
        devObj['weekPerfect'] = devObj.days / devObj.weeks;
      } else {
        devObj['weekSpread'] = devObj['weekPerfect'] = 0;
      }
      if (devObj.sprints != 0) {
        devObj['sprintSpread'] = devObj.spread / devObj.sprints;
        devObj['sprintPerfect'] = devObj.days / devObj.sprints;
      } else {
        devObj['sprintSpread'] = devObj['sprintPerfect'] = 0;
      }
      if (devObj.months != 0) {
        devObj['monthSpread'] = devObj.spread / devObj.months;
        devObj['monthPerfect'] = devObj.days / devObj.months;
      } else {
        devObj['monthSpread'] = devObj['monthPerfect'] = 0;
      }
    }

    console.log(spreadsPerDevs);

    // avg total spread for whole orga
    // the compare values are also included for better interpretation
    const totalSpread = {
      days: 0, // the same as perfect commits
      weeks: 0,
      sprints: 0,
      months: 0,
      daySpread: 0,
      dayPerfect: 0,
      weekSpread: 0,
      weekPerfect: 0,
      sprintSpread: 0,
      sprintPerfect: 0,
      monthSpread: 0,
      monthPerfect: 0,
    };
    // counters to check, which dev has not got that value
    // to subtract them from the developer amount for that calculation
    let weekCount = 0;
    let sprintCount = 0;
    let monthCount = 0;
    for (const dev of Object.keys(spreadsPerDevs)) {
      const devObj = spreadsPerDevs[dev];
      totalSpread.days += devObj.days;
      totalSpread.weeks += devObj.weeks;
      if (devObj.weeks == 0) {
        weekCount += 1;
      }
      totalSpread.sprints += devObj.sprints;
      if (devObj.sprints == 0) {
        sprintCount += 1;
      }
      totalSpread.months += devObj.months;
      if (devObj.months == 0) {
        monthCount += 1;
      }
      totalSpread.daySpread += devObj.daySpread;
      totalSpread.weekSpread += devObj.weekSpread;
      totalSpread.sprintSpread += devObj.sprintSpread;
      totalSpread.monthSpread += devObj.monthSpread;
    }
    totalSpread.daySpread = totalSpread.daySpread / developerSet.size;
    totalSpread.dayPerfect = 1;
    totalSpread.weekSpread =
      totalSpread.weekSpread / (developerSet.size - weekCount);
    totalSpread.weekPerfect =
      totalSpread.days / totalSpread.weeks / (developerSet.size - weekCount);
    totalSpread.sprintSpread =
      totalSpread.sprintSpread / (developerSet.size - sprintCount);
    totalSpread.sprintPerfect =
      totalSpread.days /
      totalSpread.sprints /
      (developerSet.size - sprintCount);
    totalSpread.monthSpread =
      totalSpread.monthSpread / (developerSet.size - monthCount);
    totalSpread.monthPerfect =
      totalSpread.days / totalSpread.months / (developerSet.size - monthCount);

    console.log(totalSpread);

    // return total spread or developer spread if true
    if (devSpread) {
      return spreadsPerDevs;
    } else {
      return totalSpread;
    }

    // helper function to add dates
    function addDays(date: string, days: number): Date {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }
  }

  /**
   * Calculates the developer spread of a specified repo only.
   * Therefor, it calls devSpreadTotal(devSpread: true),
   * to get the calculated spread for developers of the corresponding
   * organisation. Then, it takes only the developers which contributed
   * in this repository, to calculate day, week, sprint, month avg
   * spreads again.
   * @param repoIdent The repo identification including repo id and orga
   */
  async devSpreadRepo(repoIdent: RepositoryNameDto) {
    const repoM = await this.repoModel
      .findOne({ repo: repoIdent.repo, owner: repoIdent.owner })
      .exec();
    // get the commits for specified repo
    const commits = await this.getRepoCommits(repoM._id, 'timestamps');
    console.log(commits);

    // again do the calculation of the amount of days, weeks, ...
    // but now repo specific only
    const timestamps: string[] = Object.keys(commits);
    let weekDate = timestamps[0];
    let sprintDate = timestamps[0];
    let monthDate = timestamps[0];
    let week = 0;
    let sprint = 0;
    let month = 0;
    for (let i = 1; i < timestamps.length; i++) {
      if (addDays(weekDate, 7) <= new Date(timestamps[i])) {
        week += 1;
        weekDate = timestamps[i];
      }
      if (addDays(sprintDate, 14) <= new Date(timestamps[i])) {
        sprint += 1;
        sprintDate = timestamps[i];
      }
      if (addDays(monthDate, 30) <= new Date(timestamps[i])) {
        month += 1;
        monthDate = timestamps[i];
      }
    }
    // store the timeslots for the repo
    const timeslots = {
      days: timestamps.length,
      weeks: week,
      sprints: sprint,
      months: month,
    };

    // calculate the day spread:
    // get the devSpread for all developers, go through the developers
    // of every commit for that repo and add the corresponding
    // day spread of the dev (because it is his avarage for the whole
    // organisation already)
    let daySpread = 0;
    const devSpread = await this.devSpreadTotal(repoIdent.owner, true);
    for (const timestamp of timestamps) {
      for (const login of commits[timestamp]) {
        daySpread += devSpread[login].daySpread;
      }
    }

    console.log(daySpread);

    // avg spread of the repo for every time slot
    // day spread of all developers (which is accumulated avg already)
    // divide through counted commit time slots
    // provide the compare values also
    const spreadsForRepo = {
      daySpread: daySpread / timeslots.days,
      dayPerfect: 1,
      weekSpread: daySpread / timeslots.weeks,
      weekPerfect: timeslots.days / timeslots.weeks,
      sprintSpread: daySpread / timeslots.sprints,
      sprintPerfect: timeslots.days / timeslots.sprints,
      monthSpread: daySpread / timeslots.months,
      monthPerfect: timeslots.days / timeslots.months,
    };

    console.log(timeslots);
    console.log(spreadsForRepo);

    return spreadsForRepo;

    // helper function to add dates
    function addDays(date: string, days: number): Date {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }
  }
}
