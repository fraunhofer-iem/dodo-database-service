import { Issue, Release } from 'src/github-api/model/PullRequest';

export function mapReleasesToIssues(releases: Release[], issues: Issue[]) {
  const issuesInTimespan = new Map<
    number,
    { closed: Issue[]; open: Issue[]; rate: number; release: Release }
  >();
  // we start at 1, because everything happening before the first release doesn't provide
  // helpful information.
  for (let i = 1; i < releases.length; i++) {
    const currRelease = releases[i];
    const prevRelease = releases[i - 1];
    issuesInTimespan.set(currRelease.id, {
      open: [],
      closed: [],
      rate: 0,
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
    { closed: Issue[]; open: Issue[]; rate: number; release: Release }
  >,
) {
  let sumOfRates = 0;
  let noOfEmptyReleases = 0;
  releaseIssueMap.forEach((currData) => {
      const rate = calculateRate(currData)
      if (rate === undefined) {
          noOfEmptyReleases += 1
      } else {
          sumOfRates += rate
      }
  });

  return sumOfRates / (releaseIssueMap.size - noOfEmptyReleases);
}

function calculateRate(data: {
  closed: Issue[];
  open: Issue[];
  rate: number;
  release: Release;
}) {
  const noOfOpenIssues = data.open.length;
  const noOfClosedIssues = data.closed.length;
  if (noOfOpenIssues == 0 && noOfClosedIssues == 0) {
    return undefined
  } else {
    data.rate = noOfClosedIssues / (noOfOpenIssues + noOfClosedIssues);
  }
  return data.rate;
}
