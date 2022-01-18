import { Aggregate, Model } from 'mongoose';
import { RepositoryDocument } from 'src/database/schemas/repository.schema';
import { Issue } from 'src/github-api/model/PullRequest';
import { RepositoryNameDto } from 'src/github-api/model/Repository';
import { getRepoFilter } from './repoQuery';

const lookupIssueWithEvents = {
  from: 'issuewithevents',
  localField: 'issuesWithEvents',
  foreignField: '_id',
  as: 'expandedIssuesWithEvents',
};

const lookupIssues = {
  from: 'issues',
  localField: 'expandedIssuesWithEvents.issue',
  foreignField: '_id',
  as: 'expandedIssue',
};

const lookupLabels = {
  from: 'labels',
  localField: 'expandedIssue.label',
  foreignField: '_id',
  as: 'expandedIssue.expandedLabels',
};

export function getIssueQuery(
  repoModel: Model<RepositoryDocument>,
  repo: RepositoryNameDto,
  labelNames?: string[],
): Aggregate<Issue[]> {
  const query = repoModel
    .aggregate()
    .match(getRepoFilter(repo))
    .project({ issuesWithEvents: 1 })
    .unwind('$issuesWithEvents')
    .lookup(lookupIssueWithEvents)
    .unwind('$expandedIssuesWithEvents')
    .lookup(lookupIssues)
    .unwind('$expandedIssue')
    .lookup(lookupLabels)
    .replaceRoot('$expandedIssue');

  if (labelNames) {
    query.match(getMatchQueryForLabelNames(labelNames));
  }
  query
    .addFields({ labels: '$expandedLabels' })
    .project({ _id: 0, __v: 0, expandedLabels: 0, label: 0 })
    .sort({ created_at: 1 });
  return query;
}

function getMatchQueryForLabelNames(labelNames: string[]) {
  return labelNames.reduce(
    (acc, curr) => {
      acc.$and.push({
        expandedLabels: { $elemMatch: { name: curr } },
      });
      return acc;
    },
    {
      $and: [],
    },
  );
}
