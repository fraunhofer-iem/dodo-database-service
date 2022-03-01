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
    .project({
      diffs: 1,
      'prFiles.filename': 1,
      'prFiles.status': 1,
    })
    .match({
      'prFiles.status': 'modified',
      'prFiles.filename': { $not: { $in: fileFilter } },
    })
    .group({
      _id: '$diffs.pullRequest',
      changedFiles: { $push: '$prFiles.filename' },
    })
    .limit(diffsLimit);

  return query;
}
