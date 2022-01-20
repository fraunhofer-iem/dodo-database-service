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
import { getSpreadsForDev } from './dateUtil';
import {
  rearangeTimeslots,
  getRepoSpreadTotal,
  getAvgRepoSpread,
  getSpreadDates,
} from './spreadUtil';

@Injectable()
export class DeveloperFocus {
  private readonly logger = new Logger(DeveloperFocus.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
  ) {}

  /**
   * Query all commmits of a given repo
   * from the db (login, timestamp). It returns
   * all timestamps grouped by developer login.
   * @param repoId the _id of the repository model
   * @param loginFilter developer logins which should be considered
   * @param userLimit limits the amount of commits
   * @returns developers = {login1: [timestamp1, timestamp2, ...], login2: [timestamp1, timestamp2], ...}
   */
  async getRepoCommits(
    repoId: string,
    loginFilter?: string[],
    userLimit: number = 100,
  ): Promise<{ [key: string]: string[] }> {
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
      .limit(userLimit)
      .exec();

    // group by developer
    const developers: { [key: string]: string[] } = commits.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.timestamps;
        return acc;
      },
      {},
    );

    this.logger.log(developers);
    return developers;
  }

  /**
   * Calculates the spread for each developer of an organization.
   * Therefor, every repo related to specified orga currently stored
   * in DB is taken into account.
   * E.g. a developer has contributed to repository A on day X,
   * he has a spread of 1. If he had contributed to repo A, B and C on day Y,
   * he would have a spread of 3.
   * The same holds for other categorys, so if the dev had contributed
   * in repo A, B, C and D in week Z, he would have a spread of 4 in that week.
   * @param owner the owner name of the oranization whose dev spreads should be computed.
   * @param loginFilter developer logins which should be considered.
   * @param userLimit limits the amount of commits.
   * @returns the spread data for every developer in an object.
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
      spreadsPerDevs[dev] = getSpreadsForDev(timeToRepoObj);
    });

    this.logger.log(spreadsPerDevs);

    // just to print all repository arrays for every spread category after calculation
    for (const dev in spreadsPerDevs) {
      this.logger.log(dev);
      for (const spread in spreadsPerDevs[dev]) {
        if (spread == 'daySpreadSum') {
          break;
        }
        this.logger.log(spread);
        for (const timestamp in spreadsPerDevs[dev][spread]) {
          this.logger.log(spreadsPerDevs[dev][spread][timestamp]);
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
   * Calculates the avg spread values for every developer of the orga.
   * Then, with that avg values, the overall avg spread values
   * for the whole orga is being calculated.
   * The function uses the precomputed spread data spreadsPerDevs.
   * @param owner the organization which should be analyzed.
   * @returns the total avg dev spread of an orga containing the categorys
   * days, weeks, sprints and months, including the total amounts
   * of the categorys from all developers.
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

      totalSpread.days += devObj.days;
      totalSpread.weeks += devObj.weeks;
      totalSpread.sprints += devObj.sprints;
      totalSpread.months += devObj.months;
    }

    this.logger.log(devSpread);

    // compute the weighted avg for each category for all devs
    // sum of all values per category for each dev multiplied by it's weight
    // weight = number of a devs items in a category / number of total items in a category

    for (const dev of allDevelopers) {
      const devObj = devSpread[dev];

      totalSpread.daySpread += devObj.daySpread * getWeight(dev, 'days');
      totalSpread.weekSpread += devObj.weekSpread * getWeight(dev, 'weeks');
      // if dev has no sprints, exlude him from the calculation
      if (!(devObj.sprints == 0)) {
        totalSpread.sprintSpread +=
          devObj.sprintSpread * getWeight(dev, 'sprints');
      }
      totalSpread.monthSpread += devObj.monthSpread * getWeight(dev, 'months');
    }

    this.logger.log(totalSpread);
    return totalSpread;

    function getWeight(dev: string, interval: string) {
      return devSpread[dev][interval] / totalSpread[interval];
    }
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
    this.logger.log('commits: ', commits);
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

    this.logger.log(dates);

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

    this.logger.log(dates);

    // this is the presicely repository spread with timestamp:spread pairs for each category
    // the spread is beeing calculated with the sum of the dev spreads which contributed in that timestamp
    // devided trough the amount of devs
    const repoSpread: RepoSpreadTotal = getRepoSpreadTotal(dates);

    // TODO: this could also be returned as a good overview n the whole repo histroy, if desired.
    this.logger.log(repoSpread);

    // finally, build the average daySpread, weekSpread, ..., of all single daySpreads, weekSpreads, ...
    const avgRepoSpread: RepoSpreadAvg = getAvgRepoSpread(repoSpread);
    this.logger.log(avgRepoSpread);

    return avgRepoSpread;
  }
}
