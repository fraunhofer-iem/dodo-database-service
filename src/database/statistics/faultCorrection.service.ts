import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Issue } from 'src/github-api/model/PullRequest';
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
    userLimit?: number,
  ) {
    const limit = userLimit ? userLimit : 100;

    //to obtain releases, sorted on the basis of created_at time
    //TODO: limit amount of data returned, by using a projection
    const releases: { _id: string; count: number }[] = await getReleaseQuery(
      this.repoModel,
      repoIdent,
    ).exec();

    //console.log(releases);

    const issues: Issue[] = await getIssueQuery(
      this.repoModel,
      repoIdent,
      labelNames,
    ).exec();

    console.log(issues);
    for (const issu of issues) {
      for (const data of issu.labels) {
        console.log(data);
      }
    }
    console.log(issues.length);
    // //this loop matches the condition
    // //closed_bugs = issues[ label = bug, state = closed, closed_at <= release.created_at, closed_at >= release.previous().created_at ]
    // const closedBugs = this.getNoClosedBugs(closedIssues, releases);
    // const openBugs = this.getNoOpenBugs(openIssues, releases);
    // this.logger.debug(
    //   `open bugs are: ${openBugs} and closed bugs are: ${closedBugs}`,
    // );

    // const fault_correction_rate =
    //   Math.abs(closedBugs) / (Math.abs(closedBugs) + Math.abs(openBugs));

    // this.logger.debug(`Fault correction rate is: ${fault_correction_rate}`);

    // return fault_correction_rate;
    return 0;
  }

  closedTicketsForRelease(
    tickets: any[],
    releases: any[],
  ): { [release: string]: number } {
    return {};
  }
  /**
   *
   * closed_bugs = issues[ label = bug, state = closed, closed_at <= release.created_at, closed_at >= release.previous().created_at ]
   * @param closedIssues
   * @param releases
   * @returns
   */
  getNoClosedBugs(closedIssues: any[], releases: any[]): number {
    let closedBugs = 0;
    for (const closedIssue of closedIssues) {
      for (let j = 1; j < releases.length; j++) {
        if (
          this.closedBeforeRelease(closedIssue, releases[j]) &&
          this.closedAfterRelease(closedIssue, releases[j - 1])
        ) {
          closedBugs += 1;
        }
      }
    }

    return closedBugs;
  }

  getNoOpenBugs(openIssues: any[], releases: any[]): number {
    //this loop matches below condition
    //open_bugs = issues[ label = bug, state = open, created_at <= release.created_at ]
    let openBugs = 0;
    for (const openIssue of openIssues) {
      for (let j = 1; j < releases.length; j++) {
        if (this.openBeforeRelease(openIssue, releases[j])) {
          openBugs += 1;
          break;
        }
      }
    }
    return openBugs;
  }

  openBeforeRelease(issue, release) {
    return (
      issue['expandedIssue']['created_at'] <=
      release['expandedReleases']['created_at']
    );
  }

  closedBeforeRelease(issue, release) {
    return (
      issue['expandedIssue']['closed_at'] <=
      release['expandedReleases']['created_at']
    );
  }

  closedAfterRelease(issue, release) {
    return (
      issue['expandedIssue']['closed_at'] >=
      release['expandedReleases']['created_at']
    );
  }
}
