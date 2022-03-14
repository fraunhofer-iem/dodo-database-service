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
  for (let i = 0; i < set.length; i++) {
    const subset = [set[i]];
    if (subset.length == size) {
      yield subset;
    }
    for (let j = i; j < set.length; j++) {
      if (subset.length == size) {
        break;
      }
      for (let k = j + 1; k < set.length; k++) {
        if (subset.length + 1 == size) {
          yield [...subset, set[k]];
        }
      }
      subset.push(set[j + 1]);
    }
  }
}
