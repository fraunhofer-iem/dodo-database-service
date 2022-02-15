import { Aggregate } from 'mongoose';

/**
 * It returns the query which gets all release
 * cycles in an array.
 */
export function getReleaseCycleQuery(
  lookUpQuery: Aggregate<any[]>,
  issueLimit: number = 100,
): Aggregate<any[]> {
  const query = lookUpQuery
    .limit(issueLimit)
    .sort({ 'expandedRelease.published_at': 1 })
    .group({
      _id: 0,
      published_at: { $push: '$expandedRelease.published_at' },
    });
  return query;
}
