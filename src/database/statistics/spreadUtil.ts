import {
  RepoSpreadTotal,
  RepoSpread,
  DevSpread,
  RepoSpreadAvg,
} from 'src/github-api/model/DevFocus';

/**
 * Computes the total average spread for a time category
 * in relation to item amount of a category.
 * Sum of a time category of @param total / item size of the category.
 * @returns
 */
export function getAvgRepoSpread(total: RepoSpreadTotal): RepoSpreadAvg {
  const avgRepoSpread: RepoSpreadAvg = {
    daySpread:
      Object.values(total.daySpread).reduce((a, b) => a + b) /
      Object.values(total.daySpread).length,
    weekSpread:
      Object.values(total.weekSpread).reduce((a, b) => a + b) /
      Object.values(total.weekSpread).length,
    sprintSpread: 0,
    monthSpread:
      Object.values(total.monthSpread).reduce((a, b) => a + b) /
      Object.values(total.monthSpread).length,
  };
  // sprint is not given as default
  if (Object.keys(total.sprintSpread).length != 0) {
    avgRepoSpread.sprintSpread =
      Object.values(total.sprintSpread).reduce((a, b) => a + b) /
      Object.values(total.sprintSpread).length;
  }
  return avgRepoSpread;
}

/**
 * Computes the average spread to developer amount ratio
 * for each timestamp in each category of @param spreads.
 * @returns repoSpread
 */
export function getAvgSpreadPerTimeInterval(spreads: RepoSpread) {
  const repoSpread: RepoSpreadTotal = {
    daySpread: {},
    weekSpread: {},
    sprintSpread: {},
    monthSpread: {},
  };
  for (const day in spreads.daySpread) {
    const daySpread =
      Object.values(spreads.daySpread[day]).reduce((a, b) => a + b) /
      Object.values(spreads.daySpread[day]).length;
    repoSpread.daySpread[day] = daySpread;
  }
  for (const week in spreads.weekSpread) {
    const weekSpread =
      Object.values(spreads.weekSpread[week]).reduce((a, b) => a + b) /
      Object.values(spreads.weekSpread[week]).length;
    repoSpread.weekSpread[week] = weekSpread;
  }
  for (const sprint in spreads.sprintSpread) {
    const sprintSpread =
      Object.values(spreads.sprintSpread[sprint]).reduce((a, b) => a + b) /
      Object.values(spreads.sprintSpread[sprint]).length;
    repoSpread.sprintSpread[sprint] = sprintSpread;
  }
  for (const month in spreads.monthSpread) {
    const monthSpread =
      Object.values(spreads.monthSpread[month]).reduce((a, b) => a + b) /
      Object.values(spreads.monthSpread[month]).length;
    repoSpread.monthSpread[month] = monthSpread;
  }
  return repoSpread;
}

/**
 * Filters all developers from @param spreadsPerDevs,
 * which have contributed in specified @param repoId.
 * It merges all developers, which has committed for
 * that @param repoId at the same time interval
 * (days, weeks, sprints, months) and @returns an object
 * with all repository spread data and total time amounts.
 */
export function getSpreadDataPerTimeIntervals(
  repoId: string,
  spreadsPerDevs: DevSpread,
): RepoSpread {
  const spreads: RepoSpread = {
    daySpread: {},
    weekSpread: {},
    sprintSpread: {},
    monthSpread: {},
    days: 0,
    weeks: 0,
    sprints: 0,
    months: 0,
  };
  for (const dev in spreadsPerDevs) {
    for (const day in spreadsPerDevs[dev].daySpread) {
      const repoArr = spreadsPerDevs[dev].daySpread[day]; // array of repoIds
      spreads.daySpread = isRepoIDinDevSpreadArr(
        repoArr,
        spreads.daySpread,
        repoId,
        dev,
        day,
      );
    }
    for (const week in spreadsPerDevs[dev].weekSpread) {
      const repoArr = spreadsPerDevs[dev].weekSpread[week];
      spreads.weekSpread = isRepoIDinDevSpreadArr(
        repoArr,
        spreads.weekSpread,
        repoId,
        dev,
        week,
      );
    }
    for (const sprint in spreadsPerDevs[dev].sprintSpread) {
      const repoArr = spreadsPerDevs[dev].sprintSpread[sprint];
      spreads.sprintSpread = isRepoIDinDevSpreadArr(
        repoArr,
        spreads.sprintSpread,
        repoId,
        dev,
        sprint,
      );
    }
    for (const month in spreadsPerDevs[dev].monthSpread) {
      const repoArr = spreadsPerDevs[dev].monthSpread[month];
      spreads.monthSpread = isRepoIDinDevSpreadArr(
        repoArr,
        spreads.monthSpread,
        repoId,
        dev,
        month,
      );
    }
  }
  // sum of all time category items which are
  // taken into account for that repo
  spreads.days = Object.keys(spreads.daySpread).length;
  spreads.weeks = Object.keys(spreads.weekSpread).length;
  spreads.sprints = Object.keys(spreads.sprintSpread).length;
  spreads.months = Object.keys(spreads.monthSpread).length;
  return spreads;
}

/**
 * Check, if the @param repoId is in the @param repoArr of
 * the current @param dev. If there is no entry for that
 * @param date yet, add it to the @param spreadObj.
 * Then, append the dev spread to that object.
 * @returns spreadObj
 */
function isRepoIDinDevSpreadArr(
  repoArr: string[],
  spreadObj: {},
  repoId: string,
  dev: string,
  date: string,
) {
  if (repoArr.includes(repoId)) {
    if (!spreadObj.hasOwnProperty(date)) {
      spreadObj[date] = {};
    }
    spreadObj[date][dev] = repoArr.length;
  }
  return spreadObj;
}
