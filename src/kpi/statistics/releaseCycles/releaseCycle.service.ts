import { Injectable, Logger } from '@nestjs/common';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { RepositoryIdentifier } from 'src/entities/repositories/model';
import { getReleaseCycleQuery } from './lib/releaseQuery';

@Injectable()
export class ReleaseCycle {
  private readonly logger = new Logger(ReleaseCycle.name);

  constructor(private readonly repoService: RepositoryService) {}

  /**
   * Lists the release cycle in ascending order
   * for repository @param repoIdent. It consider
   * the @param releaseLimit and @returns an array.
   */
  async releaseCycle(repoIdent: RepositoryIdentifier, releaseLimit?: number) {
    const lookUpQuery = this.repoService.preAggregate(repoIdent, {
      releases: {},
    });

    const releaseCycleQuery = getReleaseCycleQuery(lookUpQuery, releaseLimit);

    const releaseCycle = (await releaseCycleQuery.exec())[0]['published_at'];

    return releaseCycle;
  }
}
