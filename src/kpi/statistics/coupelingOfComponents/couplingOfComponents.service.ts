import { Injectable, Logger } from '@nestjs/common';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { RepositoryIdentifier } from 'src/entities/repositories/model';
import { getPrFilesQuery } from './lib/prFilesQuery';

@Injectable()
export class CouplingOfComponents {
  private readonly logger = new Logger(CouplingOfComponents.name);

  constructor(private readonly repoService: RepositoryService) {}

  /**
   *
   */
  async couplingOfComponents(
    repoIdent: RepositoryIdentifier,
    diffsLimit?: number,
  ) {
    const lookUpQuery = this.repoService.preAggregate(repoIdent, {
      diffs: { pullrequestfiles: true },
    });

    const prFilesQuery = getPrFilesQuery(lookUpQuery, diffsLimit);
    console.log(await prFilesQuery.exec());

    const combinationMap = new Map<string[], number>();

    console.log(binomialSubsets(['a', 'b', 'c', 'd'], 3).length);
    console.log([...combinationMap.entries()]);

    /**
     *
     * @param arr
     * @param size
     * @returns
     */
    function binomialSubsets(arr: string[], size: number) {
      function combinations(part: string[], start: number) {
        let result = [];

        for (let i = start; i < arr.length; i++) {
          let p = [...part]; // get a copy of part
          p.push(arr[i]); // add the iterated element to p
          console.log(i, p);
          if (p.length < size) {
            // test if recursion can go on
            result = result.concat(combinations(p, i + 1)); // call combinations again & concat result
          } else {
            result.push(p); // push p to result, stop recursion
            console.log(result);
          }
        }
        console.log('rec break');
        console.log(result);
        return result;
      }

      return combinations([], 0); // start with empty part and index 0 always
    }
  }
}
