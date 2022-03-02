import { Injectable, Logger } from '@nestjs/common';
import { RepositoryIdentifier } from '../../../entities/repositories/model';
import { RepositoryDocument } from '../../../entities/repositories/model/schemas';
import {
  calculateAvgCapability,
  calculateAvgEfficiency,
  calculateAvgRate,
  mapReleasesToIssues,
} from './lib';
import { transformMapToObject } from '../lib';
import { RepositoryService } from '../../../entities/repositories/repository.service';

@Injectable()
export class IssueTrackingService {
  private readonly logger = new Logger(IssueTrackingService.name);

  constructor(private readonly repoService: RepositoryService) {}

  async issueCompletionRate(
    owner: string,
    repository: string,
    labelNames?: string[],
  ) {
    const repo = await this.repoService.read(
      { owner: owner, repo: repository },
      { commits: false, diffs: false },
    );
    await this.populateRepository(repo, labelNames);

    const releaseIssueMap = mapReleasesToIssues(repo.releases, repo.issues);
    const { avgRate, rateMap } = calculateAvgRate(releaseIssueMap);
    return {
      avgRate: avgRate,
      rawData: transformMapToObject(rateMap),
    };
  }

  async issueCompletionCapability(
    repoIdent: RepositoryIdentifier,
    labelNames?: string[],
    timeToComplete: number = 14 * 24 * 60 * 60 * 1000,
  ) {
    const repo = await this.repoService.read(
      { ...repoIdent },
      { commits: false, diffs: false },
    );
    await this.populateRepository(repo, labelNames);

    const releaseIssueMap = mapReleasesToIssues(repo.releases, repo.issues);
    const { capabilityMap, avgCapability } = calculateAvgCapability(
      releaseIssueMap,
      timeToComplete,
    );

    return { avgCapability, rawData: transformMapToObject(capabilityMap) };
  }

  async issueCompletionEfficiency(
    repoIdent: RepositoryIdentifier,
    labelNames?: string[],
    timeToComplete: number = 14 * 24 * 60 * 60 * 1000,
  ) {
    const repo = await this.repoService.read(
      { ...repoIdent },
      { commits: false, diffs: false },
    );
    await this.populateRepository(repo, labelNames);

    const releaseIssueMap = mapReleasesToIssues(repo.releases, repo.issues);
    const { efficiencyMap, avgEfficiency } = calculateAvgEfficiency(
      releaseIssueMap,
      timeToComplete,
    );

    return { avgEfficiency, rawData: transformMapToObject(efficiencyMap) };
  }

  private async populateRepository(
    repo: RepositoryDocument,
    labelNames?: string[],
  ) {
    await repo.populate([
      {
        path: 'releases',
        options: {
          sort: 'created_at',
        },
      },
      {
        path: 'issues',
        populate: {
          path: 'labels',
          match: { name: { $in: labelNames } },
        },
        select: {
          events: false,
        },
      },
    ]);

    repo.issues = repo.issues.filter((issue) => issue.labels.length > 0);
  }
}
