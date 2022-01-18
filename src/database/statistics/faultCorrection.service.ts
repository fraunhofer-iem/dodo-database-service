import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { release } from 'os';
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
    const releases = await getReleaseQuery(this.repoModel, repoIdent).exec();
    console.log(releases);
    const issues: Issue[] = await getIssueQuery(
      this.repoModel,
      repoIdent,
      labelNames,
    ).exec();
    // {releaseId: {Issues[], faultCorrectionRate }}

    // we start at 1, because everything happening before the first release doesn't provide
    // helpful information.
    const issuesInTimespan = new Map<
      Release,
      { closed: Issue[]; open: Issue[] }
    >();
    for (let i = 1; i < releases.length; i++) {
      const currRelease = releases[i];
      const prevRelease = releases[i - 1];
      issuesInTimespan.set(currRelease, { open: [], closed: [] });
      // TODO: date conversion

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
          // open during interval
          issuesInTimespan.get(currRelease).open.push(currIssue);
        }
        // get all open issues in timespan prev -> curr
        // count how many have been closed in timepsan prev -> curr
      }
    }

    issuesInTimespan.forEach((v, k) => {
      if (v.closed.length > 0 && v.open.length > 0) {
        console.log('release');
        console.log(k);
        console.log('closed');
        console.log(v.closed);
        console.log('open');
        console.log(v.open);
      }
    });

    return 0;
  }
}
