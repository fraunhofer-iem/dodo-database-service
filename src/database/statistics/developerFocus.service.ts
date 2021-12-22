import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RepositoryNameDto } from 'src/github-api/model/Repository';
import { RepositoryDocument } from '../schemas/repository.schema';

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
    userLimit?: number,
  ): Promise<{ [key: string]: [string] }> {
    const limit = userLimit ? userLimit : 100; // do we need a limit?

    const getCommits = {
      from: 'commits',
      localField: 'commits',
      foreignField: '_id',
      as: 'expandedCommits',
    };

    // get all commits for the repo with login and timestamp
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

    // create an array for grouping the values
    const commit_arr: { login: string; timestamp: string }[] = [];
    commits.forEach((commit) => {
      commit_arr.push({
        login: commit.expandedCommits.login,
        timestamp: commit.expandedCommits.timestamp,
      });
    });

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
  async devSpread(owner: string): Promise<{
    [key: string]: {
      daySpread: { [key: string]: string[] };
      weekSpread: { [key: string]: string[] };
      sprintSpread: { [key: string]: string[] };
      monthSpread: { [key: string]: string[] };
      daySpreadSum: number;
      weekSpreadSum: number;
      sprintSpreadSum: number;
      monthSpreadSum: number;
      days: number;
      weeks: number;
      sprints: number;
      months: number;
    };
  }> {
    // get all repo ids of the orga (which are already in the db)
    const repoIds = await this.repoModel
      .aggregate()
      .match({ owner: owner })
      .project({ _id: 1 })
      .exec();

    // Store all repo commit objects (grouped by developer) in one object repoDevelopers.
    // The repoId is the first key, then every repoId has developer props
    // with all their commit timestamps array for that repo
    const repoDevelopers: { [key: string]: { [key: string]: [string] } } = {};
    const developerSet: Set<string> = new Set(); // store all unique developers
    for (const repoId of repoIds) {
      const developers = await this.getRepoCommits(repoId._id);
      repoDevelopers[repoId._id] = developers;
      for (const dev of Object.keys(developers)) {
        developerSet.add(dev);
      }
    }

    console.log(repoDevelopers);

    // Now, construct an object spread with all developers as keys.
    // Then, every developer has an object with timestamps as keys,
    // and every timestamps has an array of RepoIds, so we achieve
    // unique timestamps for each developer with grouped repos for that.
    // Basically, this is the daySpread beeing calculated for each dev.
    const spread: {
      [key: string]: { [key: string]: [string] };
    } = {};
    // do this for all developers
    for (const dev of developerSet) {
      // allDevCommits stores all {timestamp:repo}[] pairs from all repos per each developer BEFORE grouping
      const allDevCommits: { timestamp: string; repo: string }[] = [];
      // do this for every repo
      for (const repoId of Object.keys(repoDevelopers)) {
        // do this for every dev in the repo, if it is the same as the current dev
        for (const repoDev in repoDevelopers[repoId]) {
          if (dev == repoDev) {
            for (const timestamp of repoDevelopers[repoId][repoDev]) {
              // store every timestamp:repoId pairs in allDevCommits
              const commit = {
                timestamp: timestamp,
                repo: repoId,
              };
              allDevCommits.push(commit);
            }
          }
        }
      }
      // directly group allDevCommits per key (timestamp)
      // to get unique timestamps with an array of the corresponding repoID as value
      spread[dev] = allDevCommits.reduce((acc, curr) => {
        if (!acc[curr.timestamp]) {
          acc[curr.timestamp] = [];
        }
        acc[curr.timestamp].push(curr.repo);
        return acc;
      }, {});
    }
    console.log(spread);

    // Now, spreadsPerDevs (the final return value) is beeing calculated.
    // Here, for every developer, all timestamps (or the begin-timestamp of an interval)
    // are beeing stored with an array of corresponding repoIds precisely.
    const spreadsPerDevs: {
      [key: string]: {
        daySpread: { [key: string]: string[] };
        weekSpread: { [key: string]: string[] };
        sprintSpread: { [key: string]: string[] };
        monthSpread: { [key: string]: string[] };
        daySpreadSum: number;
        weekSpreadSum: number;
        sprintSpreadSum: number;
        monthSpreadSum: number;
        days: number;
        weeks: number;
        sprints: number;
        months: number;
      };
    } = {};

    // for every developer in the spread object,
    // call helper function spreadsGroupedByTimeslots() to pass in
    // the object with all timestamps as keys and repoId arrays as values,
    // to compute all spreadsPerDevs props.
    for (const dev of Object.keys(spread)) {
      spreadsPerDevs[dev] = await this.spreadsGroupedByTimeslots(spread[dev]);
    }

    console.log(spreadsPerDevs);
    return spreadsPerDevs;
  }

  /**
   * Calculate the avg spread for every developer of that orga
   * and then the total avg spread for that organisation as a consequence.
   * The function uses the precomputed result spreadsPerDevs from
   * devSpread() function.
   * @param owner The organisation which should be analyzed.
   * @returns
   */
  async devSpreadTotal(owner: string): Promise<{
    daySpread: number;
    weekSpread: number;
    sprintSpread: number;
    monthSpread: number;
    days: number;
    weeks: number;
    sprints: number;
    months: number;
  }> {
    // get the spreads per each developer of that orga
    const spreadsPerDevs: {
      [key: string]: {
        daySpread: { [key: string]: string[] };
        weekSpread: { [key: string]: string[] };
        sprintSpread: { [key: string]: string[] };
        monthSpread: { [key: string]: string[] };
        daySpreadSum: number;
        weekSpreadSum: number;
        sprintSpreadSum: number;
        monthSpreadSum: number;
        days: number;
        weeks: number;
        sprints: number;
        months: number;
      };
    } = await this.devSpread(owner);

    // store the avg spread for each developer here
    // use the precomputed sums and amounts for each time category
    const devSpread: {
      [key: string]: {
        daySpread: number;
        weekSpread: number;
        sprintSpread: number;
        monthSpread: number;
        days: number;
        weeks: number;
        sprints: number;
        months: number;
      };
    } = {};

    for (const dev of Object.keys(spreadsPerDevs)) {
      // call devObj for better readability
      const devObj = spreadsPerDevs[dev];
      // init the new object
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
      devSpread[dev].daySpread = devObj.daySpreadSum / devObj.days;
      // if there were no weeks accumulated, skip them
      if (devObj.weeks != 0) {
        devSpread[dev].weekSpread = devObj.weekSpreadSum / devObj.weeks;
      } else {
        devSpread[dev].weekSpread = 0;
      }
      // if there were no sprints accumulated, skip them
      if (devObj.sprints != 0) {
        devSpread[dev].sprintSpread = devObj.sprintSpreadSum / devObj.sprints;
      } else {
        devSpread[dev].sprintSpread = 0;
      }
      // if there were no months accumulated, skip them
      if (devObj.months != 0) {
        devSpread[dev].monthSpread = devObj.monthSpreadSum / devObj.months;
      } else {
        devSpread[dev].monthSpread = 0;
      }
    }

    // TODO: We could also return that object of course, if desired.
    console.log(devSpread);

    // store the array of all developers
    const allDevelopers: string[] = Object.keys(spreadsPerDevs);

    // compute the avg total spread for the whole orga
    // store the total spread in here. This is the final return value
    // I stored the summed up amount of days, weeks, ... from all developers
    // in the totalSpread object, just to see how many objects of a time category
    // were taken into account for that end result. This can be deleted, if not desired.
    const totalSpread: {
      daySpread: number;
      weekSpread: number;
      sprintSpread: number;
      monthSpread: number;
      days: number;
      weeks: number;
      sprints: number;
      months: number;
    } = {
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
    for (const dev of Object.keys(devSpread)) {
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
    totalSpread.daySpread = totalSpread.daySpread / allDevelopers.length;
    totalSpread.weekSpread =
      totalSpread.weekSpread / (allDevelopers.length - weekCount);
    totalSpread.sprintSpread =
      totalSpread.sprintSpread / (allDevelopers.length - sprintCount);
    totalSpread.monthSpread =
      totalSpread.monthSpread / (allDevelopers.length - monthCount);

    console.log(totalSpread);
    return totalSpread;
  }

  /**
   * This method calculates the developer Spread for a specified repository only.
   * Therefor, it calls getRepoCommits() to get all developers of the repo in the first place.
   * Then, it calls devSpread() to get all spreads for each developer of that orga, the repo is corresponding to.
   * Then, only those devs are taken into account, whose contributed to the desired repo in a specific timeslot.
   * @param repoIdent The repo identification including repo id and orga
   */
  async devSpreadRepo(repoIdent: RepositoryNameDto): Promise<{
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
    const commits = await this.getRepoCommits(repoM._id);
    // store the repoId as a string
    const repoID = repoM._id.toString();
    // store the repo developers in an array
    const repoDevs = Object.keys(commits);
    // get the precomputed spreads for every organisation developer
    const spreadsPerDevs = await this.devSpread(repoIdent.owner);

    // store all corresponding commits for every timem category,
    // in which a developer contributed to the specified repo,
    // with the timestamp and the developer spread in that specific
    // timeslot directly.
    const dates: {
      daySpread: { [key: string]: { [key: string]: number } };
      weekSpread: { [key: string]: { [key: string]: number } };
      sprintSpread: { [key: string]: { [key: string]: number } };
      monthSpread: { [key: string]: { [key: string]: number } };
      days: number;
      weeks: number;
      sprints: number;
      months: number;
    } = {
      daySpread: {},
      weekSpread: {},
      sprintSpread: {},
      monthSpread: {},
      days: 0,
      weeks: 0,
      sprints: 0,
      months: 0,
    };
    // go trough every developer of the precomputed spreadsPerDevs Object
    for (const dev in spreadsPerDevs) {
      // only if the developer has contributed in the specified repo
      if (repoDevs.includes(dev)) {
        // now, for that dev, go trough every of his spread categorys separately
        for (const day in spreadsPerDevs[dev].daySpread) {
          // store his array of repoIds
          const repoArr = spreadsPerDevs[dev].daySpread[day];
          // only if the repoId of the specific repo is included in that spread
          // then, add the timestamp as a key and add the dev with its spread in that timeslot
          // to the value object of the timestamp
          if (repoArr.includes(repoID)) {
            if (!dates.daySpread.hasOwnProperty(day)) {
              dates.daySpread[day] = {};
            }
            dates.daySpread[day][dev] = repoArr.length;
          }
        }
        for (const week in spreadsPerDevs[dev].weekSpread) {
          const repoArr = spreadsPerDevs[dev].weekSpread[week];
          if (repoArr.includes(repoID)) {
            if (!dates.weekSpread.hasOwnProperty(week)) {
              dates.weekSpread[week] = {};
            }
            dates.weekSpread[week][dev] = repoArr.length;
          }
        }
        for (const sprint in spreadsPerDevs[dev].sprintSpread) {
          const repoArr = spreadsPerDevs[dev].sprintSpread[sprint];
          if (repoArr.includes(repoID)) {
            if (!dates.sprintSpread.hasOwnProperty(sprint)) {
              dates.sprintSpread[sprint] = {};
            }
            dates.sprintSpread[sprint][dev] = repoArr.length;
          }
        }
        for (const month in spreadsPerDevs[dev].monthSpread) {
          const repoArr = spreadsPerDevs[dev].monthSpread[month];
          if (repoArr.includes(repoID)) {
            if (!dates.monthSpread.hasOwnProperty(month)) {
              dates.monthSpread[month] = {};
            }
            dates.monthSpread[month][dev] = repoArr.length;
          }
        }
      }
    }
    // add all amount of categorys to dates object
    // this are all days, weeks, ... which are taken into account for that repo
    dates.days = Object.keys(dates.daySpread).length;
    dates.weeks = Object.keys(dates.weekSpread).length;
    dates.sprints = Object.keys(dates.sprintSpread).length;
    dates.months = Object.keys(dates.monthSpread).length;

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
    dates.weekSpread = await this.rearangeTimeslots(dates.weekSpread, 7);
    dates.sprintSpread = await this.rearangeTimeslots(dates.sprintSpread, 14);
    dates.monthSpread = await this.rearangeTimeslots(dates.monthSpread, 30);

    console.log(dates);

    // this is the presicely repository spread with timestamp:spread pairs for each category
    // the spread is beeing calculated with the sum of the dev spreads which contributed in that timestamp
    // devided trough the amount of devs
    const repoSpread: {
      daySpread: { [key: string]: number };
      weekSpread: { [key: string]: number };
      sprintSpread: { [key: string]: number };
      monthSpread: { [key: string]: number };
    } = { daySpread: {}, weekSpread: {}, sprintSpread: {}, monthSpread: {} };
    for (const day in dates.daySpread) {
      const daySpread =
        Object.values(dates.daySpread[day]).reduce((a, b) => a + b) /
        Object.values(dates.daySpread[day]).length;
      repoSpread.daySpread[day] = daySpread;
    }
    for (const week in dates.weekSpread) {
      const weekSpread =
        Object.values(dates.weekSpread[week]).reduce((a, b) => a + b) /
        Object.values(dates.weekSpread[week]).length;
      repoSpread.weekSpread[week] = weekSpread;
    }
    for (const sprint in dates.sprintSpread) {
      const sprintSpread =
        Object.values(dates.sprintSpread[sprint]).reduce((a, b) => a + b) /
        Object.values(dates.sprintSpread[sprint]).length;
      repoSpread.sprintSpread[sprint] = sprintSpread;
    }
    for (const month in dates.monthSpread) {
      const monthSpread =
        Object.values(dates.monthSpread[month]).reduce((a, b) => a + b) /
        Object.values(dates.monthSpread[month]).length;
      repoSpread.monthSpread[month] = monthSpread;
    }

    // TODO: this could also be returned as a good overview n the whole repo histroy, if desired.
    console.log(repoSpread);

    // finally, build the average daySpread, weekSpread, ..., of all single daySpreads, weekSpreads, ...
    const avgRepoSpread: {
      daySpread: number;
      weekSpread: number;
      sprintSpread: number;
      monthSpread: number;
    } = {
      daySpread:
        Object.values(repoSpread.daySpread).reduce((a, b) => a + b) /
        Object.values(repoSpread.daySpread).length,
      weekSpread:
        Object.values(repoSpread.weekSpread).reduce((a, b) => a + b) /
        Object.values(repoSpread.weekSpread).length,
      sprintSpread:
        Object.values(repoSpread.sprintSpread).reduce((a, b) => a + b) /
        Object.values(repoSpread.sprintSpread).length,
      monthSpread:
        Object.values(repoSpread.monthSpread).reduce((a, b) => a + b) /
        Object.values(repoSpread.monthSpread).length,
    };
    console.log(avgRepoSpread);

    return avgRepoSpread;
  }

  /**
   * Helper function to eliminate duplicate weeks, sprints or months
   * because the calculated intervals per developer may differ
   * and would have been taken as separate intervals into account,
   * altough it was the same interval of commiting.
   * @param timeSpreadPairs An object with timestamps as keys, and an object with developer:sprad pairs as a value
   * @param days The days, the interval blongs to, i.e. 7 (weeks), 14 (sprint), 30(month)
   * @returns
   */
  async rearangeTimeslots(
    timeSpreadPairs: { [key: string]: { [key: string]: number } },
    days: number,
  ): Promise<{ [key: string]: { [key: string]: number } }> {
    // copy the old timeSpreadPairs to modify on that
    const newTimeSpreadPairs: { [key: string]: { [key: string]: number } } = {
      ...timeSpreadPairs,
    };
    const timestamps: string[] = Object.keys(timeSpreadPairs).sort();
    // go through every sorted timestamp and look to successor
    for (let i = 1; i < timestamps.length; ) {
      const currentDate: string = timestamps[i - 1];
      const nextDate: string = timestamps[i];
      // check, if the next interval date should actualy be in current interval
      if ((await this.addDays(currentDate, days)) > new Date(timestamps[i])) {
        // append the values together, update the current interval object
        const devSpreadObj1 = timeSpreadPairs[currentDate];
        const devSpreadObj2 = timeSpreadPairs[nextDate];
        const mergedObj = { ...devSpreadObj1, ...devSpreadObj2 };
        newTimeSpreadPairs[currentDate] = mergedObj;
        // delete the unnessacary date and skip the next date
        delete newTimeSpreadPairs[nextDate];
        i += 2;
      } else {
        i += 1;
      }
    }
    return newTimeSpreadPairs;
  }

  /**
   * Helper function to add a number of days to an existing date.
   * @param date The date, which should be increased.
   * @param days The number of days, which should be added to the date.
   * @returns The new increased date in Date() format
   */
  async addDays(date: string, days: number): Promise<Date> {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * This function calculates all spread values for a given object with timestamps
   * as keys and arrays of repoIds as values. Therefor, in daySpread, weekSpread,
   * sprintSpread and monthSpread are stored all spreads precisely, i.e. their values
   * considered as an object in which every timestamp (or beginning timestamp of that interval)
   * is a key, with an array of the corresponding repoIds for that timestmamp as a value.
   * The Sum properties are the sums of the lenghts of all repoId arrays in a category.
   * The days, weeks, sprint, month properties are the amount of all keys (timestamps)
   * in a category (for later avg computation).
   * @param timeRepoPairs An Object of timestamps as keys, with repoId arrays as values (for a developer),
   * i.e. it's already the daySpread of a developer.
   * @returns An object with computed spreads for timeintervals, the sums of the single spreads
   * and the number of timestamps for a category.
   */
  async spreadsGroupedByTimeslots(timeRepoPairs: {
    [key: string]: [string];
  }): Promise<{
    daySpread: { [key: string]: string[] };
    weekSpread: { [key: string]: string[] };
    sprintSpread: { [key: string]: string[] };
    monthSpread: { [key: string]: string[] };
    daySpreadSum: number;
    weekSpreadSum: number;
    sprintSpreadSum: number;
    monthSpreadSum: number;
    days: number;
    weeks: number;
    sprints: number;
    months: number;
  }> {
    // sort the timestamps to ensure correct interval computation
    const timestamps: string[] = Object.keys(timeRepoPairs).sort();
    // the return object dates
    const dates: {
      daySpread: { [key: string]: string[] };
      weekSpread: { [key: string]: string[] };
      sprintSpread: { [key: string]: string[] };
      monthSpread: { [key: string]: string[] };
      daySpreadSum: number;
      weekSpreadSum: number;
      sprintSpreadSum: number;
      monthSpreadSum: number;
      days: number;
      weeks: number;
      sprints: number;
      months: number;
    } = {
      daySpread: {},
      weekSpread: {},
      sprintSpread: {},
      monthSpread: {},
      daySpreadSum: 0,
      weekSpreadSum: 0,
      sprintSpreadSum: 0,
      monthSpreadSum: 0,
      days: 0,
      weeks: 0,
      sprints: 0,
      months: 0,
    };
    // init first dayspread entry
    dates.daySpread[timestamps[0]] = timeRepoPairs[timestamps[0]];
    // init all category counters with the first timestamp
    let weekDate = timestamps[0];
    let sprintDate = timestamps[0];
    let monthDate = timestamps[0];
    // counter for category sums
    let daySpreadSum = timeRepoPairs[timestamps[0]].length; // already init it with the length of the first entrys repoID array
    let weekSpreadSum = 0;
    let sprintSpreadSum = 0;
    let monthSpreadSum = 0;
    // counstruct sets for week, sprint and month categorys to get unique repoIds to calculate the spreads
    const weekSpread: Set<string> = new Set();
    const sprintSpread: Set<string> = new Set();
    const monthSpread: Set<string> = new Set();
    // always compare the next date; if the interval fits, increase the category counters
    for (let i = 1; i < timestamps.length; i++) {
      // repo array for each timestamp
      const repoArr = timeRepoPairs[timestamps[i]];
      dates.daySpread[timestamps[i]] = repoArr; // always add entry to the daySpread category
      daySpreadSum += timeRepoPairs[timestamps[i]].length; // always add the length (spread) to the daySpreadSum
      // for other intervals, add every repo of current entry to the set
      // Then, if one timeslot is reached, increase counters with length of the set,
      // clear the set and set the category date to the new date
      repoArr.forEach((repo) => {
        weekSpread.add(repo);
        sprintSpread.add(repo);
        monthSpread.add(repo);
      });
      if ((await this.addDays(weekDate, 7)) <= new Date(timestamps[i])) {
        dates.weekSpread[weekDate] = Array.from(weekSpread);
        weekSpreadSum += weekSpread.size;
        weekSpread.clear();
        weekDate = timestamps[i];
      }
      if ((await this.addDays(sprintDate, 14)) <= new Date(timestamps[i])) {
        dates.sprintSpread[sprintDate] = Array.from(sprintSpread);
        sprintSpreadSum += sprintSpread.size;
        sprintSpread.clear();
        sprintDate = timestamps[i];
      }
      if ((await this.addDays(monthDate, 30)) <= new Date(timestamps[i])) {
        dates.monthSpread[monthDate] = Array.from(monthSpread);
        monthSpreadSum += monthSpread.size;
        monthSpread.clear();
        monthDate = timestamps[i];
      }
    }
    // after all, add the computed numbers to the dates object
    dates.daySpreadSum = daySpreadSum;
    dates.weekSpreadSum = weekSpreadSum;
    dates.sprintSpreadSum = sprintSpreadSum;
    dates.monthSpreadSum = monthSpreadSum;
    dates.days = Object.keys(dates.daySpread).length;
    dates.weeks = Object.keys(dates.weekSpread).length;
    dates.sprints = Object.keys(dates.sprintSpread).length;
    dates.months = Object.keys(dates.monthSpread).length;
    return dates;
  }
}
