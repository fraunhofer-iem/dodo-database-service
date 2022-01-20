import { Model, Aggregate } from 'mongoose';
import { RepositoryDocument } from 'src/database/schemas/repository.schema';
import { Release } from 'src/github-api/model/PullRequest';
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
