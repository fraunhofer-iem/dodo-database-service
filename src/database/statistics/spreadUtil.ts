import {
  RepoSpreadTotal,
  RepoSpread,
  DevSpread,
} from 'src/github-api/model/DevFocus';

export function getAvgRepoSpread(total: RepoSpreadTotal) {
  return {
    daySpread:
      Object.values(total.daySpread).reduce((a, b) => a + b) /
      Object.values(total.daySpread).length,
    weekSpread:
      Object.values(total.weekSpread).reduce((a, b) => a + b) /
      Object.values(total.weekSpread).length,
    sprintSpread:
      Object.values(total.sprintSpread).reduce((a, b) => a + b) /
      Object.values(total.sprintSpread).length,
    monthSpread:
      Object.values(total.monthSpread).reduce((a, b) => a + b) /
      Object.values(total.monthSpread).length,
  };
}

export function getRepoSpreadTotal(dates: RepoSpread) {
  const repoSpread: RepoSpreadTotal = {
    daySpread: {},
    weekSpread: {},
    sprintSpread: {},
    monthSpread: {},
  };
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

  return repoSpread;
}

export function getSpreadDates(
  repoId: string,
  repoDevs: string[],
  spreadsPerDevs: DevSpread,
) {
  const dates: RepoSpread = {
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
        if (repoArr.includes(repoId)) {
          if (!dates.daySpread.hasOwnProperty(day)) {
            dates.daySpread[day] = {};
          }
          dates.daySpread[day][dev] = repoArr.length;
        }
      }
      for (const week in spreadsPerDevs[dev].weekSpread) {
        const repoArr = spreadsPerDevs[dev].weekSpread[week];
        if (repoArr.includes(repoId)) {
          if (!dates.weekSpread.hasOwnProperty(week)) {
            dates.weekSpread[week] = {};
          }
          dates.weekSpread[week][dev] = repoArr.length;
        }
      }
      for (const sprint in spreadsPerDevs[dev].sprintSpread) {
        const repoArr = spreadsPerDevs[dev].sprintSpread[sprint];
        if (repoArr.includes(repoId)) {
          if (!dates.sprintSpread.hasOwnProperty(sprint)) {
            dates.sprintSpread[sprint] = {};
          }
          dates.sprintSpread[sprint][dev] = repoArr.length;
        }
      }
      for (const month in spreadsPerDevs[dev].monthSpread) {
        const repoArr = spreadsPerDevs[dev].monthSpread[month];
        if (repoArr.includes(repoId)) {
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

  return dates;
}
