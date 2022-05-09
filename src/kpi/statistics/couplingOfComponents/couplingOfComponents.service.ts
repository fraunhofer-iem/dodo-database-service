import { Injectable, Logger } from '@nestjs/common';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { Intervals, serialize } from '../lib';
import { getPrFilesQuery } from './lib/prFilesQuery';
import { getCoupling } from './lib/prFilesUtil';

@Injectable()
export class CouplingOfComponentsService {
  private readonly logger = new Logger(CouplingOfComponentsService.name);

  constructor(private readonly repoService: RepositoryService) {}

  /**
   * Computes KPI Coupling Of Compontents for @param repoIdent.
   * It exludes files from @param fileFilter and limits number of diffs
   * to @param diffsLimit, it applies size of coupling @param couplingSize
   * the amount of @param occs. Bounds to interval @param since until @param to.
   * @returns all couplings sorted descending.
   */
  async couplingOfComponents(
    interval: Intervals = Intervals.MONTH,
    owner: string,
    repo: string,
    fileFilter?: string[],
    couplingSize?: number,
    occs?: number,
    since: string = undefined,
    to: string = undefined,
  ) {
    const lookUpQuery = this.repoService.preAggregate(
      { owner: owner, repo: repo },
      {
        diffs: {
          diffFiles: true,
          pullRequest: { since: since, to: to },
        },
      },
    );

    const prFilesQuery = getPrFilesQuery(lookUpQuery, fileFilter, interval);

    const prFiles = await prFilesQuery.exec();

    const result = getCoupling(prFiles, couplingSize, occs);

    try {
      return serialize(result, interval, 'coupling');
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }
}
