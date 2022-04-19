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
          // data: result.data,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        return 'No such KPI';
      }
    }
    return { value: kpi.value, data: {} };
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
    switch (id) {
      case 'orgHealth':
        this.logger.log(
          `Generating a dummy health value for organization ${owner}`,
        );
        return { avg: Math.ceil(Math.random() * 100) };
      case 'repoHealth':
        this.logger.log(`Generating a dummy health value for ${owner}/${repo}`);
        return { avg: Math.ceil(Math.random() * 100) };

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
