import { Injectable, Logger } from '@nestjs/common';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { Intervals } from '../lib';
import { pullRequestQuery } from './lib/pullRequestQuery';

@Injectable()
export class PullRequestComplexityService {
  private readonly logger = new Logger(PullRequestComplexityService.name);

  constructor(private readonly repoService: RepositoryService) {}

  async pullRequestComplexity(
    owner: string,
    repo: string,
    interval: Intervals = Intervals.MONTH,
    since: string = undefined,
    to: string = undefined,
  ) {
    const pipeline = this.repoService.preAggregate(
      { owner: owner, repo: repo },
      {
        diffs: {
          repositoryFiles: true,
          pullRequestFiles: true,
          pullRequest: { since: since, to: to },
        },
      },
    );

    const query = pullRequestQuery(pipeline, interval);
    return await query.exec();
  }
}
