import {
  RepoSpreadPerInterval,
  RepoSpreadAvg,
  RepoSpread,
  DevSpread,
} from '../model';

/**
 * Computes the average spread for a time category.
 * Sum of a time category of @param total / item size of the category.
 * @returns
 */
export function getAvgRepoSpread(total: RepoSpreadPerInterval): RepoSpreadAvg {
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
 * Computes the size of every time interval
 * spread set in @param spreads.
 * @returns repoSpread
 */
export function getSpreadSizePerTimeInterval(spreads: RepoSpread) {
  const repoSpread: RepoSpreadPerInterval = {
    daySpread: {},
    weekSpread: {},
    sprintSpread: {},
    monthSpread: {},
  };
  for (const day in spreads.daySpread) {
    const daySpread = spreads.daySpread[day].size;
    repoSpread.daySpread[day] = daySpread;
  }
  for (const week in spreads.weekSpread) {
    const weekSpread = spreads.weekSpread[week].size;
    repoSpread.weekSpread[week] = weekSpread;
  }
  for (const sprint in spreads.sprintSpread) {
    const sprintSpread = spreads.sprintSpread[sprint].size;
    repoSpread.sprintSpread[sprint] = sprintSpread;
  }
  for (const month in spreads.monthSpread) {
    const monthSpread = spreads.monthSpread[month].size;
    repoSpread.monthSpread[month] = monthSpread;
  }
  return repoSpread;
}

/**
 * Filters all developers from @param spreadsPerDevs,
 * which have contributed in specified @param repoId.
 * It merges the spreads of all developers,
 * who have committed for that @param repoId
 * at the same time interval (days, weeks, sprints, months)
 * and @returns an object with all repository spread sets.
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
  };
  for (const dev in spreadsPerDevs) {
    for (const day in spreadsPerDevs[dev].daySpread) {
      const repoArr = spreadsPerDevs[dev].daySpread[day]; // array of repoIds
      spreads.daySpread = createSetAndAddRepoIds(
        repoArr,
        spreads.daySpread,
        repoId,
        day,
      );
    }
    for (const week in spreadsPerDevs[dev].weekSpread) {
      const repoArr = spreadsPerDevs[dev].weekSpread[week];
      spreads.weekSpread = createSetAndAddRepoIds(
        repoArr,
        spreads.weekSpread,
        repoId,
        week,
      );
    }
    for (const sprint in spreadsPerDevs[dev].sprintSpread) {
      const repoArr = spreadsPerDevs[dev].sprintSpread[sprint];
      spreads.sprintSpread = createSetAndAddRepoIds(
        repoArr,
        spreads.sprintSpread,
        repoId,
        sprint,
      );
    }
    for (const month in spreadsPerDevs[dev].monthSpread) {
      const repoArr = spreadsPerDevs[dev].monthSpread[month];
      spreads.monthSpread = createSetAndAddRepoIds(
        repoArr,
        spreads.monthSpread,
        repoId,
        month,
      );
    }
  }
  return spreads;
}

/**
 * Check, if the @param repoId is in the @param repoArr of
 * the current @param dev. If there is no entry for that
 * @param date yet, create a new set for that date.
 * Then, add the dev spread repo ids to that set.
 * @returns spreadObj
 */
function createSetAndAddRepoIds(
  repoArr: string[],
  spreadObj: Record<string, Set<string>>,
  repoId: string,
  date: string,
) {
  if (repoArr.includes(repoId)) {
    if (!spreadObj.hasOwnProperty(date)) {
      spreadObj[date] = new Set();
    }
    repoArr.forEach((repoid) => {
      spreadObj[date].add(repoid);
    });
  }
  return spreadObj;
}
