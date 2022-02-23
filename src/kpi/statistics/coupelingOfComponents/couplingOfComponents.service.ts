import { Injectable, Logger } from '@nestjs/common';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { RepositoryIdentifier } from 'src/entities/repositories/model';
import { getPrFilesQuery } from './lib/prFilesQuery';
import { getCoupling } from './lib/prFilesUtil';
import { coupling } from './model/coupling';

@Injectable()
export class CouplingOfComponents {
  private readonly logger = new Logger(CouplingOfComponents.name);

  constructor(private readonly repoService: RepositoryService) {}

  /**
   * Computes KPI Coupling Of Compontents for @param repoIdent.
   * It exludes files from @param fileFilter and limits number of diffs
   * to @param diffsLimit, it applies size of coupling @param couplingSize
   * the amount of @param occs.
   * @returns all couplings sorted descending.
   */
  async couplingOfComponents(
    repoIdent: RepositoryIdentifier,
    diffsLimit?: number,
    fileFilter?: string[],
    couplingSize?: number,
    occs?: number,
  ) {
    const lookUpQuery = this.repoService.preAggregate(repoIdent, {
      diffs: { prFiles: true },
    });

    const prFilesQuery = getPrFilesQuery(lookUpQuery, diffsLimit, fileFilter);

    const prFiles = await prFilesQuery.exec();
    const prAmount = prFiles.length;

    const coupling: coupling[] = getCoupling(prFiles, couplingSize, occs);

    return coupling;
  }
}
