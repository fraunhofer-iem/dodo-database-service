import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Issue, Release } from 'src/github-api/model/PullRequest';
import { RepositoryNameDto } from 'src/github-api/model/Repository';
import { RepositoryDocument } from '../schemas/repository.schema';
import { calculateAvgRate, mapReleasesToIssues } from './issueUtil';
import { getIssueQuery } from './lib/issueQuery';
import { getReleaseQuery } from './lib/releaseQuery';
import { transformMapToObject } from './lib/transformMapToObject';

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

    const releaseIssueMap = mapReleasesToIssues(releases, issues);

    return {
      avgRate: calculateAvgRate(releaseIssueMap),
      rawData: transformMapToObject(releaseIssueMap),
    };
  }
}
