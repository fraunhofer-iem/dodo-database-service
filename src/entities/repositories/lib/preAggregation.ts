import { Aggregate } from 'mongoose';

const lookupIssue = {
  from: 'issues',
  localField: 'issues',
  foreignField: '_id',
  as: 'expandedIssue',
};

const lookupLabels = {
  from: 'labels',
  localField: 'expandedIssue.labels',
  foreignField: '_id',
  as: 'expandedLabels',
};

const lookupAssignees = {
  from: 'users',
  localField: 'expandedIssue.assignees',
  foreignField: '_id',
  as: 'expandedAssignees',
};

export function issuesLabelsAssigneesLookup(
  query: Aggregate<any[]>,
): Aggregate<any[]> {
  return query
    .lookup(lookupIssue)
    .unwind('$expandedIssue')
    .lookup(lookupAssignees)
    .unwind('$expandedAssignees')
    .lookup(lookupLabels)
    .unwind('expandedLabels');
}
