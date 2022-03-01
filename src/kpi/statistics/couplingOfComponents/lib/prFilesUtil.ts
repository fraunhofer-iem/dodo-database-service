import { ObjectId } from 'mongoose';
import { coupling } from '../model/coupling';

/**
 * It computes the coupling over all PRs and their changed files
 * from @param prFiles coupling size of @param couplingSize and
 * it considers occurences of the couplings of at least @param occs.
 * @returns an array with all couplings, occurences and related PRs.
 */
export function getCoupling(
  prFiles: { _id: ObjectId; changedFiles: string[] }[],
  couplingSize: number = 3,
  occs: number = 3,
): coupling[] {
  const combinationMap = new Map<
    string,
    { occs: number; pullrequests: string[] }
  >();

  prFiles.forEach((diff) => {
    const combinations = binomialSubsets(diff.changedFiles, couplingSize);
    const pr = diff._id.toString();
    combinations.forEach((combo) => {
      const key: string = combo.sort().join(' ');
      if (combinationMap.has(key)) {
        increaseCounterAndAddPR(key, pr);
      } else {
        addFileCombinationToMap(key, pr);
      }
    });
  });

  deleteOccurences(occs);

  // sorting map entries descending by occurences
  const res = [...combinationMap.entries()].sort(
    (a, b) => b[1]['occs'] - a[1]['occs'],
  );

  return res;

  function increaseCounterAndAddPR(key: string, pr: string) {
    const newAmount = combinationMap.get(key).occs + 1;
    const newPRs = [...combinationMap.get(key).pullrequests, ...[pr]];
    combinationMap.set(key, { occs: newAmount, pullrequests: newPRs });
  }

  function addFileCombinationToMap(key: string, pr: string) {
    combinationMap.set(key, { occs: 1, pullrequests: [pr] });
  }

  function deleteOccurences(occs: number) {
    for (let [key, val] of combinationMap.entries()) {
      if (val.occs < occs) {
        combinationMap.delete(key);
      }
    }
  }
}

/**
 * Computes all binomial subsets of @param arr with @param size.
 * I.e. all combinations without order and without repetition.
 * @returns an array with all combination arrays, if input array
 * is greater than size. If same size, it returns the input array,
 * else it returns an empty erray.
 */
function binomialSubsets(arr: string[], size: number): string[][] {
  function combinations(part: string[], start: number) {
    let result = [];

    for (let i = start; i < arr.length; i++) {
      let p = [...part]; // get a copy of part
      p.push(arr[i]); // add the iterated element to p
      if (p.length < size) {
        // test if recursion can go on
        result = result.concat(combinations(p, i + 1)); // call combinations again & concat result
      } else {
        result.push(p); // push p to result, stop recursion
      }
    }
    return result;
  }

  return combinations([], 0); // start with empty part and index 0 always
}
