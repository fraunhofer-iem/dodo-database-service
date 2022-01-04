import { RepoSpreadTotal, RepoSpread } from 'src/github-api/model/PullRequest';

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
