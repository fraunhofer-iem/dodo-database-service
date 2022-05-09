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
    .unwind('diffs.files')
    .group({
      _id: '$diffs.pullRequest._id',
      pullRequestNumber: { $first: '$diffs.pullRequest.number' },
      comments: { $first: '$diffs.pullRequest.comments' },
      changedFiles: { $addToSet: '$diffs.files' },
      repoFiles: { $addToSet: '$diffs.repositoryFiles.path' },
    })
    .project({
      _id: 0,
      pullRequestNumber: '$pullRequest',
      comments: '$comments',
      locChanged: { $sum: '$changedFiles.changes' },
      changedFiles: { $size: '$changedFiles.filename' },
      repoFiles: { $size: '$repoFiles' },
      percentageFileChanges: {
        $ceil: {
          $multiply: [
            {
              $divide: [
                { $size: '$changedFiles.filename' },
                { $size: '$repoFiles' },
              ],
            },
            100,
          ],
        },
      },
    })
    .group({
      _id: groupByIntervalSelector('$pullRequest.created_at', interval),
      pullRequests: {
        $push: '$$ROOT',
      },
    });
}
