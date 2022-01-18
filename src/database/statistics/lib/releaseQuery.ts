import { Model, Aggregate } from 'mongoose';
import { RepositoryDocument } from 'src/database/schemas/repository.schema';
import { RepositoryNameDto } from 'src/github-api/model/Repository';
import { getRepoFilter } from './repoQuery';

const releaseLookup = {
  from: 'releases',
  localField: 'releases',
  foreignField: '_id',
  as: 'expandedReleases',
};

export function getReleaseQuery(
  repoModel: Model<RepositoryDocument>,
  repo: RepositoryNameDto,
): Aggregate<any[]> {
  return repoModel
    .aggregate()
    .match(getRepoFilter(repo))
    .unwind('$releases')
    .lookup(releaseLookup)
    .unwind('$expandedReleases')
    .sort({ 'expandedReleases.created_at': 1 });
}
