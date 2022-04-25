import { Injectable, Logger } from '@nestjs/common';
import { KpiDocument } from 'src/entities/kpis/model/schemas';
import { CouplingOfComponentsService } from './statistics/couplingOfComponents/couplingOfComponents.service';
import { DeveloperSpreadService } from './statistics/developerSpread/developerSpread.service';
import { IssueTrackingService } from './statistics/issueTracking/issueTracking.service';
import { Intervals } from './statistics/lib';
import { MeanTimeToResolutionService } from './statistics/meanTimeToResolution/meanTimeToResolution.service';
import { PullRequestComplexityService } from './statistics/pullRequestComplexity/pullRequestComponents.service';
import { ReleaseCycleService } from './statistics/releaseCycles/releaseCycle.service';
import { KpiService as KpiRunService } from '../entities/kpis/kpi.service';

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);

  constructor(
    private readonly kpiRunService: KpiRunService,
    private readonly issueTrackingService: IssueTrackingService,
    private readonly meanTimeToResolutionService: MeanTimeToResolutionService,
    private readonly releaseCycleService: ReleaseCycleService,
    private readonly couplingOfComponentsService: CouplingOfComponentsService,
    private readonly developerSpreadService: DeveloperSpreadService,
    private readonly pullRequestComplexityService: PullRequestComplexityService,
  ) {}

  public async getKpi(params: {
    id: string;
    owner: string;
    repo?: string;
    since?: string;
    to: string;
    interval: Intervals;
    labelFilter?: string[];
    fileFilter?: string[];
    couplingSize?: number;
    occurences?: number;
    timeToComplete?: number;
    includeData?: boolean;
  }) {
    Object.keys(params).forEach(
      (key) => params[key] === undefined && delete params[key],
    );
    let kpi: KpiDocument = undefined;
    try {
      kpi = await this.kpiRunService.read(params);
    } catch {
      try {
        const result = await this.calculateKpi(params);
        kpi = await this.kpiRunService.create({
          ...params,
          value: result['avg'],
          data: result.data,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        throw err;
      }
    }
    return {
      owner: kpi.owner,
      repo: kpi.repo,
      id: kpi.id,
      value: kpi.value,
      data: params.includeData ? kpi.data : undefined,
    };
  }

  public async calculateKpi(params: {
    id: string;
    owner: string;
    repo?: string;
    since?: string;
    to: string;
    interval: Intervals;
    labelFilter?: string[];
    fileFilter?: string[];
    couplingSize?: number;
    occurences?: number;
    timeToComplete?: number;
  }) {
    const {
      id,
      owner,
      repo,
      since,
      to,
      interval,
      labelFilter,
      fileFilter,
      couplingSize,
      occurences,
      timeToComplete,
    } = params;
    const data = {};
    const d1 = new Date(since);
    const d2 = new Date(to);
    switch (id) {
      case 'orgHealth':
        this.logger.log(
          `Generating a dummy health value for organization ${owner}`,
        );
        while (d1 < d2) {
          if (!Object.keys(data).includes('' + d1.getUTCFullYear())) {
            data[d1.getUTCFullYear()] = {};
          }
          data[d1.getUTCFullYear()][d1.getUTCMonth()] = Math.round(
            Math.random() * 100,
          );
          d1.setUTCMonth(d1.getUTCMonth() + 1);
        }
        return { avg: Math.round(Math.random() * 100), data };
      case 'repoHealth':
        this.logger.log(`Generating a dummy health value for ${owner}/${repo}`);
        while (d1 < d2) {
          if (!Object.keys(data).includes('' + d1.getUTCFullYear())) {
            data[d1.getUTCFullYear()] = {};
          }
          data[d1.getUTCFullYear()][d1.getUTCMonth()] = {
            avg: Math.round(Math.random() * 100),
          };
          d1.setUTCMonth(d1.getUTCMonth() + 1);
        }
        return { avg: Math.round(Math.random() * 100), data: data };

      // case 'icr':
      //   this.logger.log(
      //     `Calculating issue completion rate for ${owner}/${repo}`,
      //   );
      //   return this.issueTrackingService.issueCompletionRate(
      //     owner,
      //     repo,
      //     labelFilter,
      //   );

      // case 'icc':
      //   this.logger.log(
      //     `Calculating issue completion capability for ${owner}/${repo}`,
      //   );
      //   return this.issueTrackingService.issueCompletionCapability(
      //     owner,
      //     repo,
      //     labelFilter,
      //     timeToComplete,
      //   );

      // case 'ice':
      //   this.logger.log(
      //     `Calculating issue completion efficiency for ${owner}/${repo}`,
      //   );
      //   return this.issueTrackingService.issueCompletionEfficiency(
      //     owner,
      //     repo,
      //     labelFilter,
      //     timeToComplete,
      //   );

      case 'devSpread':
        this.logger.log(`Calculating developer spread for ${owner}/${repo}`);
        return this.developerSpreadService.developerSpread(
          interval,
          owner,
          repo,
          since,
          to,
        );

      case 'releaseCycle':
        this.logger.log(`Calculating the release cycle for ${owner}/${repo}`);
        return this.releaseCycleService.releaseCycle(
          interval,
          owner,
          repo,
          since,
          to,
        );

      case 'coc':
        this.logger.log(
          `Calculating coupling of components for ${owner}/${repo}`,
        );
        return this.couplingOfComponentsService.couplingOfComponents(
          interval,
          owner,
          repo,
          fileFilter,
          couplingSize,
          occurences,
          since,
          to,
        );

      case 'mttr':
        this.logger.log(
          `Calculating the mean time to resolution for ${owner}/${repo}`,
        );
        return this.meanTimeToResolutionService.meanTimeToResolution(
          {
            owner: owner,
            repo: repo,
          },
          interval,
          labelFilter,
          since,
          to,
        );

      // case 'prComplexity':
      //   this.logger.log(
      //     `Calculating the complexity of pull requests for ${owner}/${repo}`,
      //   );
      //   return this.pullRequestComplexityService.pullRequestComplexity(
      //     owner,
      //     repo,
      //     interval,
      //     since,
      //     to,
      //   );
      default:
        throw new Error('No such KPI');
    }
  }
}
