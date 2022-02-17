import { Aggregate } from 'mongoose';

export function getPrFilesQuery(
  lookUpQuery: Aggregate<any[]>,
  diffsLimit: number = 100,
): Aggregate<any[]> {
  const query = lookUpQuery
    .project({
      expandedDiff: 1,
      'expandedPullRequestFiles.filename': 1,
      'expandedPullRequestFiles.status': 1,
    })
    .match({ 'expandedPullRequestFiles.status': 'modified' })
    .group({
      _id: '$expandedDiff',
      changedFiles: { $push: '$expandedPullRequestFiles.filename' },
    });
  return query;
}
