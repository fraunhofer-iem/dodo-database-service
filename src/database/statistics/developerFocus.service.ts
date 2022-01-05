import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RepositoryNameDto } from 'src/github-api/model/Repository';
import {
  DevSpread,
  DevSpreadAvg,
  DevSpreadTotal,
  RepoSpread,
  RepoSpreadAvg,
  RepoSpreadTotal,
} from 'src/github-api/model/DevFocus';
import { RepositoryDocument } from '../schemas/repository.schema';
import { rearangeTimeslots, spreadsGroupedByTimeslots } from './dateUtil';
import {
  getRepoSpreadTotal,
  getAvgRepoSpread,
  getSpreadDates,
} from './spreadUtil';
import internal from 'stream';

@Injectable()
export class DeveloperFocus {
  private readonly logger = new Logger(DeveloperFocus.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
  ) {}

  /**
   * Helper function to query all commmits of a given repo
   * from the db (login, timestamp). It returns
   * all timestamps grouped by developer login.
   * @param repoId The _id of the repository model
   * @param userLimit Not currently used
   * @returns developers = {login1: [timestamp1, timestamp2, ...], login2: [timestamp1, timestamp2], ...}
   */
  async getRepoCommits(
    repoId: string,
    loginFilter?: string[],
    userLimit?: number,
  ): Promise<{ [key: string]: string[] }> {
    const limit = userLimit ? userLimit : 100; // do we need a limit?

    const getCommits = {
      from: 'commits',
      localField: 'commits',
      foreignField: '_id',
      as: 'expandedCommits',
    };

    const query = this.repoModel
      .aggregate<{ _id: string; timestamps: string[] }>()
      .match({ _id: repoId })
      .project({ commits: 1 })
      .unwind('$commits')
      .lookup(getCommits)
      .unwind('$expandedCommits')
      .project({
        login: '$expandedCommits.login',
        timestamp: '$expandedCommits.timestamp',
        _id: 0,
      });

    // works fine as I can see it. I will delete this comment after I have written the tests.
    if (loginFilter) {
      query.match({ login: { $in: loginFilter } });
    }

    query.group({
      _id: '$login',
      // addToSet for no duplicates, substr for date only
      timestamps: { $addToSet: { $substr: ['$timestamp', 0, 10] } },
    });

    // sort because addToSet is without order, apply the limit
    const commits = await query
      .unwind('$timestamps')
      .sort({ timestamps: 1 })
      .group({ _id: '$_id', timestamps: { $push: '$timestamps' } })
      .limit(limit)
      .exec();

    // group by developer
    const developers: { [key: string]: string[] } = commits.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.timestamps;
        return acc;
      },
      {},
    );

    return developers;
  }

  /**
   * The function calculates the spread for each developer
   * for timeslots days, weeks, sprints and months
   * over the whole organisation which is specified.
   * Therefor, it takes every repo into account, which is currently
   * stored for the organisation. E.g. a developer has contributed
   * to repository A on day X, he has a spread of 1. If he had contributed
   * to repo A, B and C on day Y, he would have a spread of 3.
   * The same holds for other intervals, so if the dev had contributed
   * in repo A, B, C and D in week Z, he would have a spread of 4 in that week.
   * @param owner The organisation whose dev spreads should be analysed.
   * @returns An Object with login as key for each developer. Every developer
   * then has daySpread, weekSpread, sprintSpread and monthSpread props, in which
   * every timestamp (beginning timestamp for intervals) is stored,
   * with an array of the repoIds, the dev has contributed the same time.
   * For further calculations, the sums of all spreads and the days are
   * precomputed here, too.
   */
  async devSpread(
    owner: string,
    loginFilter?: string[],
    userLimit?: number,
  ): Promise<DevSpread> {
    const repoIds: { _id: string }[] = await this.repoModel
      .aggregate()
      .match({ owner: owner })
      .project({ _id: 1 })
      .exec();

    // devId -> TimeStamp -> RepoId
    const devToTimestampToRepo = new Map<string, Map<string, string[]>>();

    for (const repoId of repoIds) {
      const devToTimestamps = await this.getRepoCommits(
        repoId._id,
        loginFilter,
        userLimit,
      );

      const repoIdString = repoId._id.toString();

      for (const [dev, timestamps] of Object.entries(devToTimestamps)) {
        if (!devToTimestampToRepo.has(dev)) {
          this.addNewDevToMap(
            dev,
            timestamps,
            repoIdString,
            devToTimestampToRepo,
          );
        } else {
          this.extendExistingDevEntry(
            timestamps,
            repoIdString,
            devToTimestampToRepo.get(dev),
          );
        }
      }
    }

    const spreadsPerDevs: DevSpread = {};

    devToTimestampToRepo.forEach((timeToRepo, dev) => {
      const timeToRepoObj = Object.fromEntries(timeToRepo);
      // TODO: refactor spreadsGroupedByTimeslots
      spreadsPerDevs[dev] = spreadsGroupedByTimeslots(timeToRepoObj);
    });

    console.log(spreadsPerDevs);

    for (const dev in spreadsPerDevs) {
      console.log(dev);
      for (const spread in spreadsPerDevs[dev]) {
        for (const timestamp in spreadsPerDevs[dev][spread]) {
          console.log(spreadsPerDevs[dev][spread][timestamp]);
        }
      }
    }

    return spreadsPerDevs;
  }

  /**
   *
   * Adds the given @param repoId to the timestamp map.
   * If map doesn't contain the @param timestamps the entry is added.
   */
  private extendExistingDevEntry(
    timestamps: string[],
    repoId: string,
    timeStampRepo: Map<string, string[]>,
  ) {
    for (const timeStamp of timestamps) {
      if (timeStampRepo.has(timeStamp)) {
        timeStampRepo.get(timeStamp).push(repoId);
      } else {
        timeStampRepo.set(timeStamp, [repoId]);
      }
    }
  }

  /**
   * Adds a new map for every @param timpestamps to the
   * given @param map, if the entry doesn't exist.
   * The new map contains an array of repository ids.
   */
  private addNewDevToMap(
    dev: string,
    timestamps: string[],
    repoId: string,
    map: Map<string, Map<string, string[]>>,
  ) {
    const timeStampRepo = new Map<string, string[]>();
    map.set(dev, timeStampRepo);
    for (const timeStamp of timestamps) {
      timeStampRepo.set(timeStamp, [repoId]);
    }
  }

  /**
   * Calculate the avg spread for every developer of that orga
   * and then the total avg spread for that organisation as a consequence.
   * The function uses the precomputed result spreadsPerDevs from
   * devSpread() function.
   * @param owner The organisation which should be analyzed.
   * @returns
   */
  async devSpreadTotal(
    owner: string,
    loginFilter?: string[],
    userLimit?: number,
  ): Promise<DevSpreadTotal> {
    const spreadsPerDevs: DevSpread = await this.devSpread(
      owner,
      loginFilter,
      userLimit,
    );

    const allDevelopers: string[] = Object.keys(spreadsPerDevs);
    const devSpread: DevSpreadAvg = {};

    // calculate avg spread for every dev
    for (const dev of allDevelopers) {
      const devObj = spreadsPerDevs[dev];

      devSpread[dev] = {
        daySpread: 0,
        weekSpread: 0,
        sprintSpread: 0,
        monthSpread: 0,
        days: devObj.days,
        weeks: devObj.weeks,
        sprints: devObj.sprints,
        months: devObj.months,
      };
      devSpread[dev].daySpread = this.saveDivision(
        devObj.daySpreadSum,
        devObj.days,
      );

      devSpread[dev].weekSpread = this.saveDivision(
        devObj.weekSpreadSum,
        devObj.weeks,
      );

      devSpread[dev].sprintSpread = this.saveDivision(
        devObj.sprintSpreadSum,
        devObj.sprints,
      );

      devSpread[dev].monthSpread = this.saveDivision(
        devObj.monthSpreadSum,
        devObj.months,
      );
    }

    console.log(devSpread);

    // compute the total avg spread relative to all devs
    // of the whole orga
    // weekSpread e.g. is sum of all weekSpread values
    // of all devs divided with the amount of devs
    // days, weeks, ... is sum of each category from all devs
    const totalSpread: DevSpreadTotal = {
      daySpread: 0,
      weekSpread: 0,
      sprintSpread: 0,
      monthSpread: 0,
      days: 0,
      weeks: 0,
      sprints: 0,
      months: 0,
    };

    // counters to check, which of the devs have not got a value in a category
    // then, subtract them from the developer amount for that avg calculation
    let weekCount = 0;
    let sprintCount = 0;
    let monthCount = 0;
    // sum every avg value for a category of each developer, then devide this trough the amount of developers
    // which have contributed to that category
    for (const dev of allDevelopers) {
      const devObj = devSpread[dev];
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

    totalSpread.daySpread = this.saveDivision(
      totalSpread.daySpread,
      allDevelopers.length,
    );

    totalSpread.weekSpread = this.saveDivision(
      totalSpread.weekSpread,
      allDevelopers.length - weekCount,
    );

    totalSpread.sprintSpread = this.saveDivision(
      totalSpread.sprintSpread,
      allDevelopers.length - sprintCount,
    );

    totalSpread.monthSpread = this.saveDivision(
      totalSpread.monthSpread,
      allDevelopers.length - monthCount,
    );

    console.log(totalSpread);
    return totalSpread;
  }

  private saveDivision(a: number, b: number): number {
    if (isNaN(a / b)) {
      return 0;
    }
    return a / b;
  }

  /**
   * This method calculates the developer Spread for a specified repository only.
   * Therefor, it calls getRepoCommits() to get all developers of the repo in the first place.
   * Then, it calls devSpread() to get all spreads for each developer of that orga, the repo is corresponding to.
   * Then, only those devs are taken into account, whose contributed to the desired repo in a specific timeslot.
   * @param repoIdent The repo identification including repo id and orga
   */
  async devSpreadRepo(
    repoIdent: RepositoryNameDto,
    loginFilter?: string[],
    userLimit?: number,
  ): Promise<{
    daySpread: number;
    weekSpread: number;
    sprintSpread: number;
    monthSpread: number;
  }> {
    // get the repo model to get the repoId
    const repoM = await this.repoModel
      .findOne({ repo: repoIdent.repo, owner: repoIdent.owner })
      .exec();

    // get the commits for specified repo to get the developers of that repo
    const commits = await this.getRepoCommits(
      repoM._id,
      loginFilter,
      userLimit,
    );
    console.log('commits: ', commits);
    // store the repoId as a string
    const repoID = repoM._id.toString();
    // store the repo developers in an array
    const repoDevs = Object.keys(commits);
    // get the precomputed spreads for every organisation developer
    const spreadsPerDevs = await this.devSpread(repoIdent.owner);

    // store all corresponding commits for every time category,
    // in which a developer contributed to the specified repo,
    // with the timestamp and the developer spread in that specific
    // timeslot directly.
    // TODO: refactor utility method
    const dates: RepoSpread = getSpreadDates(repoID, repoDevs, spreadsPerDevs);

    console.log(dates);

    // Now, we need a little fix; consider dev A, which has contributed in week X,
    // which starts at '2021-09-06' and then in week Y which starts at '2021-09-13' again,
    // because his timeslots were calculated with his daily commit timestamps like this.
    // Now, dev B has his own time interval computation based on his daily commit timestamps,
    // consider he has contributed in wee week Z which starts at '2021-09-09'.
    // So, we don't want to count the weeks as 3 weeks, as the week Z actually belongs in week X,
    // we want to have 2 weeks of them and add dev B to the week X and delete week Z.
    // This happens in rearangeTimeSlots() for weeks, sprints and months, as days
    // are already precisely.
    dates.weekSpread = rearangeTimeslots(dates.weekSpread, 7);
    dates.sprintSpread = rearangeTimeslots(dates.sprintSpread, 14);
    dates.monthSpread = rearangeTimeslots(dates.monthSpread, 30);

    console.log(dates);

    // this is the presicely repository spread with timestamp:spread pairs for each category
    // the spread is beeing calculated with the sum of the dev spreads which contributed in that timestamp
    // devided trough the amount of devs
    const repoSpread: RepoSpreadTotal = getRepoSpreadTotal(dates);

    // TODO: this could also be returned as a good overview n the whole repo histroy, if desired.
    console.log(repoSpread);

    // finally, build the average daySpread, weekSpread, ..., of all single daySpreads, weekSpreads, ...
    const avgRepoSpread: RepoSpreadAvg = getAvgRepoSpread(repoSpread);
    console.log(avgRepoSpread);

    return avgRepoSpread;
  }
}
