import { Aggregate, ObjectId } from 'mongoose';
import { PullRequestDocument } from 'src/entities/pullRequests/model/schemas';
import { groupByIntervalSelector, Intervals } from '../../lib';

export function pullRequestQuery(
  query: Aggregate<any[]>,
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
      loc: number;
      repoFiles: string[];
    }[];
  }[]
> {
  return query
    .unwind('diffs')
    .unwind('diffs.pullRequestFiles')
    .unwind('diffs.repositoryFiles')
    .group({
      _id: '$diffs.pullRequest._id',
      pullRequest: { $first: '$diffs.pullRequest.number' },
      changedFiles: { $push: '$diffs.pullRequestFiles.filename' },
      loc: { $sum: '$diffs.pullRequestFiles.changes' },
      repoFiles: { $push: '$diffs.repositoryFiles.path' },
    })
    .group({
      _id: groupByIntervalSelector('$pullRequest.created_at', interval),
      pullRequests: {
        $push: '$$ROOT',
      },
    });
}
