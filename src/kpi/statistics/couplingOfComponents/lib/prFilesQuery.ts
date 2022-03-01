import { Aggregate, ObjectId } from 'mongoose';

/**
 * Extends preaggregated query @param lookUpQuery and
 * aggregates all changed files for every PR. It exludes all
 * files in @param fileFilter and applies the @param diffsLimit.
 */
export function getPrFilesQuery(
  lookUpQuery: Aggregate<any[]>,
  diffsLimit: number = 100,
  fileFilter: string[] = [],
): Aggregate<{ _id: ObjectId; changedFiles: string[] }[]> {
  const query = lookUpQuery
    .unwind('diffs')
    .unwind('diffs.pullRequestFiles')
    .match({
      'diffs.pullRequestFiles.status': 'modified',
      'diffs.pullRequestFiles.filename': { $not: { $in: fileFilter } },
    })
    .group({
      _id: '$diffs.pullRequest._id',
      changedFiles: { $push: '$diffs.pullRequestFiles.filename' },
    });

  return query;
}
