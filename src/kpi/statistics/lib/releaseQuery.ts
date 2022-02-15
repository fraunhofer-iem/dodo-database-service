import { Model, Aggregate } from 'mongoose';
import { RepositoryIdentifier } from '../../../entities/repositories/model';
import { RepositoryDocument } from '../../../entities/repositories/model/schemas';
import { Release } from '../../../entities/releases/model';
import { getRepoFilter } from './repoQuery';

const releaseLookup = {
  from: 'releases',
  localField: 'releases',
  foreignField: '_id',
  as: 'expandedReleases',
};

export function getReleaseQuery(
  repoModel: Model<RepositoryDocument>,
  repo: RepositoryIdentifier,
): Aggregate<Release[]> {
  return repoModel
    .aggregate()
    .match(getRepoFilter(repo))
    .unwind('$releases')
    .lookup(releaseLookup)
    .unwind('$expandedReleases')
    .replaceRoot('expandedReleases')
    .project({ _id: 0, __v: 0 })
    .sort({ created_at: 1 });
}
