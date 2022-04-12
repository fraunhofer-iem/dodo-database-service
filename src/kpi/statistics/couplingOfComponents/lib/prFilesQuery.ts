import { Aggregate, ObjectId } from 'mongoose';
import { PullRequestDocument } from '../../../../entities/pullRequests/model/schemas';
import { groupByIntervalSelector, Intervals } from '../../lib';

/**
 * Extends preaggregated query @param lookUpQuery and
 * aggregates all changed files for every PR. It exludes all
 * files in @param fileFilter and applies the @param diffsLimit.
 */
export function getPrFilesQuery(
  lookUpQuery: Aggregate<any[]>,
  fileFilter: string[] = [],
  interval: Intervals = Intervals.MONTH,
): Aggregate<
  {
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
  }[]
> {
  return lookUpQuery
    .unwind('diffs')
    .unwind('diffs.pullRequestFiles')
    .match({
      'diffs.pullRequestFiles.status': 'modified',
      'diffs.pullRequestFiles.filename': { $not: { $in: fileFilter } },
    })
    .group({
      _id: '$diffs.pullRequest._id',
      pullRequest: { $first: '$diffs.pullRequest' },
      changedFiles: { $push: '$diffs.pullRequestFiles.filename' },
    })
    .group({
      _id: groupByIntervalSelector('$pullRequest.created_at', interval),
      pullRequests: {
        $push: '$$ROOT',
      },
    });
}
