import { OCTOKIT } from '../../../lib';
import { PullRequest } from '../../pullRequests/model';
import { RepositoryIdentifier } from '../../repositories/model';

export async function* pullRequestQuerier(repoIdent: RepositoryIdentifier) {
  let page: PullRequest[] = [];
  let pageNumber = 1;

  do {
    page = await queryPullRequestPage(repoIdent, pageNumber);
    yield* page.filter((issue) => !('pull_request' in issue));
    pageNumber += 1;
  } while (page.length == 100);
}

async function queryPullRequestPage(
  repoIdent: RepositoryIdentifier,
  pageNumber: number,
) {
  const { owner, repo } = repoIdent;
  return OCTOKIT.rest.pulls
    .list({
      owner: owner,
      repo: repo,
      state: 'all',
      sort: 'created',
      direction: 'asc',
      per_page: 100,
      page: pageNumber,
    })
    .then((res) => res.data);
}
