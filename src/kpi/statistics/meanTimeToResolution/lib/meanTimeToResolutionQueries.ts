import { Aggregate } from 'mongoose';
import { avgLabelData } from '../model/meanTimeToResolution';

/**
 * Querys every issue in repo @param repoId
 * (until @param issueLimit) and computes avg times
 * in days, weeks, months for every issue label
 * (or for @param labelFilter only).
 * @returns the final query
 */
export function getTimeToResolutionQuery(
  lookUpQuery: Aggregate<any[]>,
  issueLimit: number = 100,
  labelFilter?: string[],
) {
  const query: Aggregate<avgLabelData[]> = lookUpQuery
    .unwind('issues')
    .match({
      'issues.labels': { $not: { $size: 0 } },
    })
    .limit(issueLimit)
    .unwind('issues.labels')
    .group({
      _id: '$issues',
      labelName: { $push: '$issues.labels.name' },
    });

  if (labelFilter) {
    query.match({ labelName: { $in: labelFilter } });
  }

  query.project({
    id: '$_id._id',
    name: '$_id.title',
    label: { $arrayElemAt: ['$labelName', 0] },
    creation: '$_id.created_at',
    closing: { $ifNull: ['$_id.closed_at', new Date()] },
    _id: 0,
  });

  return extendQueryToAvg();

  function extendQueryToAvg() {
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

    // avg per label
    const avg = query.group({
      _id: '$label',
      count: { $sum: 1 },
      dayAvg: { $avg: '$days' },
      weekAvg: { $avg: '$weeks' },
      monthAvg: { $avg: '$months' },
    });

    return avg;
  }
}
