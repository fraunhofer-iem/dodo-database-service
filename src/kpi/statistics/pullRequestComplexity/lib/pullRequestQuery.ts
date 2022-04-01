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
      locChanged: number;
      repoFiles: string[];
    }[];
  }[]
> {
  return query
    .unwind('diffs')
    .unwind('diffs.repositoryFiles')
    .unwind('diffs.pullRequestFiles')
    .group({
      _id: '$diffs.pullRequest._id',
      pullRequest: { $first: '$diffs.pullRequest.number' },
      changedFiles: { $addToSet: '$diffs.pullRequestFiles' },
      repoFiles: { $addToSet: '$diffs.repositoryFiles.path' },
    })
    .project({
      _id: 0,
      pullRequest: '$pullRequest',
      locChanged: { $sum: '$changedFiles.changes' },
      changedFiles: '$changedFiles.filename',
      repoFiles: '$repoFiles',
    })
    .group({
      _id: groupByIntervalSelector('$pullRequest.created_at', interval),
      pullRequests: {
        $push: '$$ROOT',
      },
    });
}
