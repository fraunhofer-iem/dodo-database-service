import { RepositoryIdentifier } from '../../../repositories/model';

export function getRepoFilter(repo: RepositoryIdentifier) {
  return {
    repo: repo.repo,
    owner: repo.owner,
  };
}
