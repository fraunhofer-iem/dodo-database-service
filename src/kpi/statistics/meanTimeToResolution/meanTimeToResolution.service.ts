import { Injectable, Logger } from '@nestjs/common';
import { getTimeToResolutionQuery } from './lib/meanTimeToResolutionQueries';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { RepositoryIdentifier } from 'src/entities/repositories/model';

@Injectable()
export class TimeToResolution {
  private readonly logger = new Logger(TimeToResolution.name);

  constructor(private readonly repoService: RepositoryService) {}

  /**
   * Computes mean time to resolution for all issue labels of
   * @param repoIdent as default. It includes the first @param issueLimit
   * issues and if provided, it only computes avg times for @param labelFilter.
   * @returns the mean time to resultion for every label
   */
  async meanTimeToResolution(
    repoIdent: RepositoryIdentifier,
    issueLimit?: number,
    labelFilter?: string[],
    since: string = undefined,
    to: string = undefined,
  ) {
    const lookUpQuery = this.repoService.preAggregate(repoIdent, {
      issues: { labels: true, since: since, to: to },
    });
    const timeToResolutionQuery = getTimeToResolutionQuery(
      lookUpQuery,
      issueLimit,
      labelFilter,
    );
    const meanTimeToResolution = await timeToResolutionQuery.exec();
    return meanTimeToResolution;
  }
}
