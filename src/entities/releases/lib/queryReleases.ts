import { OCTOKIT } from '../../../lib';
import { RepositoryIdentifier } from '../../repositories/model';

export async function queryReleases(
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
