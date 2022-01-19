import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Issue, Release } from 'src/github-api/model/PullRequest';
import { RepositoryNameDto } from 'src/github-api/model/Repository';
import { RepositoryDocument } from '../schemas/repository.schema';
import { getIssueQuery } from './lib/issueQuery';
import { getReleaseQuery } from './lib/releaseQuery';

@Injectable()
export class FaultCorrection {
  private readonly logger = new Logger(FaultCorrection.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
  ) {}

  /**
   * The Fault Correction Rate describes the development team's capability to respond to bug reports.
   * It is a quantitative indicator for which we consider all issues labeled bug (or some other equivalent tag) that existed at the time of a release.
   * The Fault Correction Rate is the amount of closed bug issues divided by the total amount of bug issues.
   *
   * (release, issues) => {
   * closed_bugs = issues[ label = bug, state = closed, closed_at <= release.created_at, closed_at >= release.previous().created_at ]
   * open_bugs = issues[ label = bug, state = open, created_at <= release.created_at ]
   * return |closed_bugs| / |closed_bugs| + |open_bugs|
   *   }
   * @param repoIdent
   * @param userLimit
   */
  async faultCorrectionRate(
    repoIdent: RepositoryNameDto,
    labelNames?: string[],
  ) {
    const queries = [
      getReleaseQuery(this.repoModel, repoIdent).exec(),
      getIssueQuery(this.repoModel, repoIdent, labelNames).exec(),
    ];
    const promiseResults = await Promise.all(queries);

    const releases = promiseResults[0] as Release[];
    const issues = promiseResults[1] as Issue[];

    const issuesInTimespan = this.createReleaseToIssue(releases, issues);

    return this.calculateCorrectionRate(issuesInTimespan);
  }

  calculateCorrectionRate(
    issuesInTimespan: Map<
      Release,
      { closed: Issue[]; open: Issue[]; rate: number }
    >,
  ) {
    let avgRate = 0;
    let noEmptyReleases = 0;
    issuesInTimespan.forEach((issue) => {
      const noOpen = issue.open.length;
      const noClosed = issue.closed.length;
      if (noOpen > 0 && noClosed > 0) {
        issue.rate =
          issue.closed.length / (issue.open.length + issue.closed.length);
        avgRate += issue.rate;
      } else {
        noEmptyReleases += 1;
      }
    });
    avgRate = avgRate / (issuesInTimespan.size - noEmptyReleases);

    return { avgRate: avgRate, rawData: this.mapToJson(issuesInTimespan) };
  }

  mapToJson(
    map: Map<Release, { closed: Issue[]; open: Issue[]; rate: number }>,
  ) {
    const json = {};
    map.forEach((value, key) => {
      json[key.id] = { ...value, release: key };
    });
    return json;
  }

  createReleaseToIssue(releases: Release[], issues: Issue[]) {
    const issuesInTimespan = new Map<
      Release,
      { closed: Issue[]; open: Issue[]; rate: number }
    >();
    // we start at 1, because everything happening before the first release doesn't provide
    // helpful information.
    for (let i = 1; i < releases.length; i++) {
      const currRelease = releases[i];
      const prevRelease = releases[i - 1];
      issuesInTimespan.set(currRelease, { open: [], closed: [], rate: 0 });

      for (const currIssue of issues) {
        if (
          currIssue.state === 'closed' &&
          currIssue.closed_at <= currRelease.created_at &&
          currIssue.closed_at >= prevRelease.created_at
        ) {
          // closed issues in interval
          issuesInTimespan.get(currRelease).closed.push(currIssue);
        }

        if (
          currIssue.created_at <= currRelease.created_at &&
          currIssue.closed_at >= currRelease.created_at
        ) {
          // open issues in interval
          issuesInTimespan.get(currRelease).open.push(currIssue);
        }
      }
    }

    return issuesInTimespan;
  }
}
