import { Aggregate, Model } from 'mongoose';
import { RepositoryDocument } from 'src/database/schemas/repository.schema';
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
): Aggregate<any[]> {
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
    .project({ expandedIssue: 1 });

  if (labelNames) {
    query.match(getMatchQueryForLabelNames(labelNames));
  }
  query.sort({ 'expandedIssue.created_at': 1 });
  return query;
}

function getMatchQueryForLabelNames(labelNames: string[]) {
  return labelNames.reduce(
    (acc, curr) => {
      acc.$and.push({
        'expandedIssue.expandedLabels': { $elemMatch: { name: curr } },
      });
      return acc;
    },
    {
      $and: [],
    },
  );
}
