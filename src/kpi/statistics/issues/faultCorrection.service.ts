import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Issue } from '../../../entities/issues/model';
import { RepositoryIdentifier } from '../../../entities/repositories/model';
import { RepositoryDocument } from '../../../entities/repositories/model/schemas';
import { Release } from '../../../entities/releases/model';
import {
  getReleaseQuery,
  getIssueQuery,
  mapReleasesToIssues,
  calculateAvgRate,
  transformMapToObject,
  calculateAvgCapability,
  calculateAvgEfficiency,
} from '../lib';

@Injectable()
export class FaultCorrectionService {
  private readonly logger = new Logger(FaultCorrectionService.name);

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
    repoIdent: RepositoryIdentifier,
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

    const { avgRate, rateMap } = calculateAvgRate(releaseIssueMap);
    return {
      avgRate: avgRate,
      rawData: transformMapToObject(rateMap),
    };
  }

  /**
   * The Fault Correction Capability describes the development team's capability to respond to bug reports.
   * In more detail, it assesses the rate of faults corrected within the time frame the organization aims to adhere to for fault correction.
   * For this qualitative indicator we take all issues labeled `bug` (or some other equivalent label) into consideration that have been resolved since the previous release.
   *
   * (release, issues[label = "bug", state = "closed"], T_bug) => {
   * bugs = [ bug for bug in issues
   *          if bug.closed_at <= release.created_at and
   *             bug.closed_at >= release.previous().created_at ]
   *
   * bugs_corrected_in_time = [ bug for bug in bugs
   *                            if bug.closed_at - bug.created_at <= T_bug ]
   *
   * return |bugs_corrected_in_time| / | bugs |
   *  }
   *
   * @param repoIdent
   * @param userLimit
   * @returns
   */
  async faultCorrectionCapability(
    repoIdent: RepositoryIdentifier,
    labelNames?: string[],
    timeToCorrect = 1209600000,
  ) {
    const queries = [
      getReleaseQuery(this.repoModel, repoIdent).exec(),
      getIssueQuery(this.repoModel, repoIdent, labelNames).exec(),
    ];
    const promiseResults = await Promise.all(queries);

    const releases = promiseResults[0] as Release[];
    const issues = promiseResults[1] as Issue[];

    const releaseIssueMap = mapReleasesToIssues(releases, issues);

    const { capabilityMap, avgCapability } = calculateAvgCapability(
      releaseIssueMap,
      timeToCorrect,
    );

    return { avgCapability, rawData: transformMapToObject(capabilityMap) };
  }

  async faultCorrectionEfficiency(
    repoIdent: RepositoryIdentifier,
    labelNames?: string[],
    timeToCorrect: number = 14 * 24 * 60 * 60 * 1000,
  ) {
    const queries = [
      getReleaseQuery(this.repoModel, repoIdent).exec(),
      getIssueQuery(this.repoModel, repoIdent, labelNames).exec(),
    ];
    const promiseResults = await Promise.all(queries);

    const releases = promiseResults[0] as Release[];
    const issues = promiseResults[1] as Issue[];

    const releaseIssueMap = mapReleasesToIssues(releases, issues);

    const { efficiencyMap, avgEfficiency } = calculateAvgEfficiency(
      releaseIssueMap,
      timeToCorrect,
    );

    return { avgEfficiency, rawData: transformMapToObject(efficiencyMap) };
  }
}
