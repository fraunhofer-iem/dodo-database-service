import { Issue, Release } from 'src/github-api/model/PullRequest';

export function mapReleasesToIssues(releases: Release[], issues: Issue[]) {
  const issuesInTimespan = new Map<
    number,
    { closed: Issue[]; open: Issue[]; release: Release }
  >();
  // we start at 1, because everything happening before the first release doesn't provide
  // helpful information.
  for (let i = 1; i < releases.length; i++) {
    const currRelease = releases[i];
    const prevRelease = releases[i - 1];
    issuesInTimespan.set(currRelease.id, {
      open: [],
      closed: [],
      release: currRelease,
    });

    for (const currIssue of issues) {
      if (
        currIssue.state === 'closed' &&
        currIssue.closed_at <= currRelease.created_at &&
        currIssue.closed_at >= prevRelease.created_at
      ) {
        // closed issues in interval
        issuesInTimespan.get(currRelease.id).closed.push(currIssue);
      }

      if (
        currIssue.created_at <= currRelease.created_at &&
        currIssue.closed_at >= currRelease.created_at
      ) {
        // open issues in interval
        issuesInTimespan.get(currRelease.id).open.push(currIssue);
      }
    }
  }

  return issuesInTimespan;
}

export function calculateAvgRate(
  releaseIssueMap: Map<
    number,
    { closed: Issue[]; open: Issue[]; release: Release }
  >,
) {
  let sumOfRates = 0;
  let noOfEmptyReleases = 0;
  const rateMap = new Map<
    number,
    {
      closed: Issue[];
      open: Issue[];
      release: Release;
      rate: number;
    }
  >();
  releaseIssueMap.forEach((currData) => {
    const rate = calculateRate(currData);
    if (rate === undefined) {
      noOfEmptyReleases += 1;
    } else {
      sumOfRates += rate;
    }
    rateMap.set(currData.release.id, { ...currData, rate: rate });
  });

  return {
    rateMap: rateMap,
    avgRate: sumOfRates / (releaseIssueMap.size - noOfEmptyReleases),
  };
}

function calculateRate(data: {
  closed: Issue[];
  open: Issue[];
  release: Release;
}): number {
  const noOfOpenIssues = data.open.length;
  const noOfClosedIssues = data.closed.length;
  if (noOfOpenIssues == 0 && noOfClosedIssues == 0) {
    return undefined;
  } else {
    return noOfClosedIssues / (noOfOpenIssues + noOfClosedIssues);
  }
}

export function calculateAvgCapability(
  releaseIssueMap: Map<
    number,
    { closed: Issue[]; open: Issue[]; release: Release }
  >,
  allowedTime: number,
) {
  const capabilityMap = new Map<
    number,
    {
      successes: Issue[];
      failures: Issue[];
      capability: number;
      release: Release;
    }
  >();

  let sumOfCapabilities = 0;
  let noOfEmptyReleases = 0;

  releaseIssueMap.forEach((currData) => {
    const capability = calculateCapability(currData, allowedTime);
    if (!currData.closed.length) {
      noOfEmptyReleases += 1;
    } else {
      sumOfCapabilities += capability.capability;
    }
    capabilityMap.set(currData.release.id, {
      ...capability,
      release: currData.release,
    });
  });

  return {
    capabilityMap,
    avgCapability:
      sumOfCapabilities / (releaseIssueMap.size - noOfEmptyReleases),
  };
}

function calculateCapability(
  data: {
    closed: Issue[];
  },
  allowedTime: number,
): { capability: number; successes: Issue[]; failures: Issue[] } {
  const successes: Issue[] = [];
  const failures: Issue[] = [];
  for (const currIssue of data.closed) {
    const closedAt = new Date(currIssue.closed_at).valueOf();
    const createdAt = new Date(currIssue.created_at).valueOf();

    if (closedAt - createdAt <= allowedTime) {
      successes.push(currIssue);
    } else {
      failures.push(currIssue);
    }
  }

  let capability = 0;
  if (data.closed.length) {
    capability = successes.length / data.closed.length;
  }

  return {
    capability,
    successes,
    failures,
  };
}

export function calculateAvgEfficiency(
  releaseIssueMap: Map<
    number,
    { closed: Issue[]; open: Issue[]; release: Release }
  >,
  allowedTime: number,
) {
  const efficiencyMap = new Map<
    number,
    {
      issues: (Issue & { efficiency: number })[];
      efficiency: number;
      release: Release;
    }
  >();

  let sumOfEfficiencies = 0;
  let noOfEmptyReleases = 0;

  releaseIssueMap.forEach((currData) => {
    const efficiency = calculateEfficiency(currData, allowedTime);
    if (!currData.closed.length) {
      noOfEmptyReleases += 1;
    } else {
      sumOfEfficiencies += efficiency.efficiency;
    }
    efficiencyMap.set(currData.release.id, {
      ...efficiency,
      release: currData.release,
    });
  });

  return {
    efficiencyMap,
    avgEfficiency:
      sumOfEfficiencies / (releaseIssueMap.size - noOfEmptyReleases),
  };
}

function calculateEfficiency(
  data: {
    closed: Issue[];
  },
  allowedTime: number,
): { efficiency: number; issues: (Issue & { efficiency: number })[] } {
  const issues: (Issue & { efficiency: number })[] = [];

  let sumOfEfficiencies = 0;
  for (const currIssue of data.closed) {
    const closedAt = new Date(currIssue.closed_at).valueOf();
    const createdAt = new Date(currIssue.created_at).valueOf();
    const implementationTime = closedAt - createdAt;

    const efficiency = implementationTime / allowedTime;
    sumOfEfficiencies += efficiency;
    issues.push({ ...currIssue, efficiency });
  }

  let efficiency = 0;
  if (issues.length) {
    efficiency = sumOfEfficiencies / issues.length;
  }

  return {
    efficiency,
    issues,
  };
}
