import { Release } from '../../../entities/releases/model';
import { RepositoryIdentifier } from '../../../entities/repositories/model';
import { OCTOKIT } from '../../../lib';
import { querier } from './querier';

export async function* releaseQuerier(repoIdent: RepositoryIdentifier) {
  yield* querier<Release>(repoIdent, queryReleasePage, () => true);
}

async function queryReleasePage(
  repoIdent: RepositoryIdentifier,
  pageNumber: number,
) {
  const { owner, repo } = repoIdent;
  return OCTOKIT.rest.repos
    .listReleases({
      owner: owner,
      repo: repo,
      per_page: 100,
      page: pageNumber,
    })
    .then((res) => res.data);
}