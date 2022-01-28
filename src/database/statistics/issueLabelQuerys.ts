import { Aggregate, Model } from 'mongoose';
import { avgDataPerLabel } from 'src/github-api/model/DevFocus';
import { RepositoryDocument } from '../schemas/repository.schema';

const lookupIssuesWithEvents = {
  from: 'issuewithevents',
  localField: 'issuesWithEvents',
  foreignField: '_id',
  as: 'expandedIssuesWithEvents',
};

const lookupIssueEventTypes = {
  from: 'issueeventtypes',
  localField: 'expandedIssuesWithEvents.issueEventTypes',
  foreignField: '_id',
  as: 'expanadedissueEventTypes',
};

const lookupIssue = {
  from: 'issues',
  localField: 'expandedIssuesWithEvents.issue',
  foreignField: '_id',
  as: 'expandedIssue',
};

const lookupLabels = {
  from: 'labels',
  localField: 'expandedIssue.label',
  foreignField: '_id',
  as: 'expandedLabels',
};

const lookupAssignees = {
  from: 'assignees',
  localField: 'expandedIssue.assignees',
  foreignField: '_id',
  as: 'expandedAssignees',
};

/**
 * Querys every issue in repo @param repoId
 * (until @param issueLimit) and expands every issue
 * for every dev (who is in @param loginFilter)
 * and for every label labeled.
 * Then, it extends that query to compute data for
 * weighted avg directly on the database.
 * @returns the final query
 */
export function getIssueLabelQuery(
  repomodel: Model<RepositoryDocument>,
  repoId: string,
  loginFilter?: string[],
  issueLimit: number = 100,
): Aggregate<avgDataPerLabel[]> {
  const query: Aggregate<avgDataPerLabel[]> = repomodel
    .aggregate()
    .match({ repo: repoId })
    .project({ issuesWithEvents: 1 })
    .unwind('$issuesWithEvents')
    .lookup(lookupIssuesWithEvents)
    .unwind('$expandedIssuesWithEvents')
    .lookup(lookupIssueEventTypes)
    .unwind('$expanadedissueEventTypes')
    .match({
      'expanadedissueEventTypes.event': { $in: ['assigned', 'labeled'] },
    })
    .lookup(lookupIssue)
    .unwind('$expandedIssue')
    .project({ expandedIssue: 1 })
    .lookup(lookupAssignees)
    .unwind('$expandedAssignees')
    .lookup(lookupLabels)
    .unwind('expandedLabels')
    .group({
      _id: '$expandedIssue',
      assignees: { $addToSet: '$expandedAssignees.login' },
      labels: { $addToSet: '$expandedLabels.name' },
    })
    .limit(issueLimit) // limit amount of issues
    .unwind('assignees');

  if (loginFilter) {
    query.match({ assignees: { $in: loginFilter } });
  }

  const issues = query.unwind('labels').project({
    id: '$_id._id',
    name: '$_id.title',
    assignee: '$assignees',
    label: '$labels',
    creation: '$_id.created_at',
    closing: { $ifNull: ['$_id.closed_at', new Date()] },
    _id: 0,
  });

  return extendQueryToAvgData(issues);
}

/**
 * Extends @param query to compute all data
 * necessary to calculate weigthed avg
 * and @returns the query.
 */
function extendQueryToAvgData(query: Aggregate<avgDataPerLabel[]>) {
  // get amount of days, weeks, months from creation to closing
  query.project({
    id: '$id',
    name: '$name',
    assignee: '$assignee',
    label: '$label',
    days: {
      $dateDiff: {
        startDate: { $toDate: '$creation' },
        endDate: { $toDate: '$closing' },
        unit: 'day',
      },
    },
    weeks: {
      $dateDiff: {
        startDate: { $toDate: '$creation' },
        endDate: { $toDate: '$closing' },
        unit: 'week',
      },
    },
    months: {
      $dateDiff: {
        startDate: { $toDate: '$creation' },
        endDate: { $toDate: '$closing' },
        unit: 'month',
      },
    },
  });

  // avg per dev per label
  const avg = query.group({
    _id: { assignee: '$assignee', label: '$label' },
    count: { $sum: 1 },
    dayAvg: { $avg: '$days' },
    weekAvg: { $avg: '$weeks' },
    monthAvg: { $avg: '$months' },
  });

  // data to compute weigthed avg
  const total = avg.group({
    _id: '$_id.label',
    total: { $sum: '$count' },
    count: { $push: '$count' },
    assignee: { $push: '$_id.assignee' },
    dayAvg: {
      $push: '$dayAvg',
    },
    weekAvg: { $push: '$weekAvg' },
    monthAvg: { $push: '$monthAvg' },
  });

  return total;
}
