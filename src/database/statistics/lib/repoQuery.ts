import { RepositoryNameDto } from 'src/github-api/model/Repository';

export function getRepoFilter(repo: RepositoryNameDto) {
  return {
    repo: repo.repo,
    owner: repo.owner,
  };
}
