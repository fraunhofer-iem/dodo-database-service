import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Issue } from '../../../entities/issues/model';
import { RepositoryIdentifier } from '../../../entities/repositories/model';
import { RepositoryDocument } from '../../../entities/repositories/model/schemas';
import { Release } from '../../../entities/releases/model';
import {
  calculateAvgCapability,
  calculateAvgEfficiency,
  calculateAvgRate,
  getIssueQuery,
  getReleaseQuery,
  mapReleasesToIssues,
  transformMapToObject,
} from '../lib';

@Injectable()
export class FeatureCompletionService {
  private readonly logger = new Logger(FeatureCompletionService.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
  ) {}

  /**
   * The Feature Completion Rate describes the development team's capability to add features to the project.
   * It is a quantitative indicator for which we consider all issues labeled enhancement (or some other equivalent tag) that existed at the time of a release.
   * The Feature Completion Rate is the amount of closed enhancement issues divided by the total amount of enhancement issues.
   *
   * (release, issues) => {
   *     closed_features = issues[ label = enhancement, state = closed, closed_at <= release.created_at, closed_at >= release.previous().created_at ]
   *     open_features = issues[ label = enhancement, state = open, created_at <= release.created_at ]
   *
   *  return |closed_features| / |closed_features| + |open_features|
   * }
   * @param repoIdent
   * @param userLimit
   */
  async featureCompletionRate(
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
   * The Feature Completion Capability describes the development team's capability to add features to the project.
   * In more detail, it assesses the rate of features completed within the time frame the organization aims to adhere to for feature completion.
   * For this qualitative indicator we take all issues labeled enhancement (or some other equivalent label) into consideration that have been resolved since the previous release.
   *
   * (release, issues[label = "enhancement", state = "closed"], T_feature) => {
   * features = [ feature for feature in issues
   *              if feature.closed_at <= release.created_at and
   *                 feature.closed_at >= release.previous().created_at ]
   *
   * features_completed_in_time = [ feature for feature in features
   *                                if feature.closed_at - feature.created_at <= T_feature ]
   *
   * return |features_completed_in_time| / | features |
   * }
   * @param repoIdent
   * @param userLimit
   * @returns
   */
  async featureCompletionCapability(
    repoIdent: RepositoryIdentifier,
    labelNames?: string[],
    timeToComplete: number = 14 * 24 * 60 * 60 * 1000,
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
      timeToComplete,
    );

    return { avgCapability, rawData: transformMapToObject(capabilityMap) };
  }

  async featureCompletionEfficiency(
    repoIdent: RepositoryIdentifier,
    labelNames?: string[],
    timeToComplete: number = 14 * 24 * 60 * 60 * 1000,
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
      timeToComplete,
    );

    return { avgEfficiency, rawData: transformMapToObject(efficiencyMap) };
  }
}
