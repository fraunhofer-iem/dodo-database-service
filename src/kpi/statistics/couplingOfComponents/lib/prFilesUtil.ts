import { ObjectId } from 'mongoose';
import { PullRequestDocument } from '../../../../entities/pullRequests/model/schemas';
import { KpiWithIntervalData, transformMapToObject } from '../../lib';
import { CombinationMap } from '../model/CombinationMap';

/**
 * It computes the coupling over all PRs and their changed files
 * from @param prFiles coupling size of @param couplingSize and
 * it considers occurences of the couplings of at least @param occs.
 * @returns an array with all couplings, occurences and related PRs.
 */
export function getCoupling(
  intervals: {
    _id: {
      year: number;
      month: number | null;
      week: number | null;
      day: number | null;
    };
    pullRequests: {
      _id: ObjectId;
      pullRequest: PullRequestDocument;
      changedFiles: string[];
    }[];
  }[],
  couplingSize: number = 3,
  minOccurences: number = 3,
) {
  if (!intervals) {
    return undefined;
  }
  const result: KpiWithIntervalData = { avg: 0, data: [] };

  let couplingTotal = 0;
  let subsetTotal = 0;
  for (const interval of intervals) {
    const combinationMap: CombinationMap = new Map<
      string,
      { occurences: number; pullRequests: string[] }
    >();
    for (const pullRequest of interval.pullRequests) {
      for (const subset of subsets(
        pullRequest.changedFiles.sort(),
        couplingSize,
      )) {
        const key = subset.join(' ');
        if (!combinationMap.has(key)) {
          registerSubset(combinationMap, key);
        }
        countOccurence(combinationMap, key, pullRequest.pullRequest);
      }
    }
    filterIrrelevantSubsets(combinationMap, minOccurences);

    if (combinationMap.size) {
      const avgCoupling = calculateAverage(combinationMap);
      result.data.push({
        _id: interval._id,
        avg: avgCoupling,
        data: [...Object.entries(transformMapToObject(combinationMap))],
      });

      couplingTotal += avgCoupling * combinationMap.size;
      subsetTotal += combinationMap.size;
    }
  }
  result.avg = couplingTotal / subsetTotal;
  return result;
}

function registerSubset(map: CombinationMap, subset: string) {
  map.set(subset, { occurences: 0, pullRequests: [] });
}

function countOccurence(
  map: CombinationMap,
  subset: string,
  pullRequest: PullRequestDocument,
) {
  const entry = map.get(subset);
  entry.occurences += 1;
  entry.pullRequests.push(pullRequest._id.toString());
}

function filterIrrelevantSubsets(map: CombinationMap, minOccurences: number) {
  for (const [key, entry] of map.entries()) {
    if (entry.occurences < minOccurences) {
      map.delete(key);
    }
  }
}

function calculateAverage(map: CombinationMap) {
  let sum = 0;
  for (const [key, entry] of map.entries()) {
    sum += entry.occurences;
  }
  return sum / map.size;
}

function* subsets(set: string[], size: number = 1) {
  if (size > set.length) {
    return [];
  }
  const subset: number[] = [];
  for (let i = 0; i < size; i++) {
    // the first subset is the combination of
    // the elements [0, 1, 2, 3]
    subset.push(i);
  }
  while (true) {
    yield subset.map((i) => set[i]);

    if (subset[0] == set.length - size) {
      // the last subset is always the combination [set.length-size : set.length-1]
      break;
    }

    for (let j = subset.length - 1; j >= 0; j--) {
      if (subset[j] < set.length - size + j) {
        // find the first element in the combination, that can be increased by one
        subset[j] += 1;
        for (let k = 1; j + k < subset.length; k++) {
          // set the successors to subset[j]'s direct successors in set
          subset[j + k] = subset[j] + k;
        }
        break;
      }
    }
  }
}
