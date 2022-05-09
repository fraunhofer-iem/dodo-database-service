import { Aggregate, Model } from 'mongoose';
import { RepositoryIdentifier } from '../../../../entities/repositories/model';
import { RepositoryDocument } from '../../../../entities/repositories/model/schemas';

export function getMostChangedFiles(
  repoIdent: RepositoryIdentifier,
  repoModel: Model<RepositoryDocument>,
  limit?: number,
): Aggregate<{ _id: string; count: number }[]> {
  const group = {
    _id: '$pullFiles.filename',
    count: { $sum: 1 },
  };

  const getDiffs = {
    from: 'diffs',
    localField: 'diffs',
    foreignField: '_id',
    as: 'expandedDiffs',
  };

  const getPullFiles = {
    from: 'difffiles',
    localField: 'expandedDiffs.files',
    foreignField: '_id',
    as: 'pullFiles',
  };
  // TODO: check which data is actually returned and use projection
  return repoModel
    .aggregate()
    .match(repoIdent)
    .unwind('$diffs')
    .lookup(getDiffs)
    .lookup(getPullFiles)
    .unwind('$pullFiles')
    .group(group)
    .sort({ count: -1 }) //sort reverted
    .limit(limit);
}

export function getAvg(elements: { count: number }[]) {
  let counterSum = 0;
  elements.forEach((e) => {
    counterSum += e.count;
  });
  return counterSum / elements.length;
}
