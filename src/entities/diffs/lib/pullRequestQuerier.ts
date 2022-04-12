import { OCTOKIT } from '../../../lib';
import { PullRequest } from '../../pullRequests/model';
import { RepositoryIdentifier } from '../../repositories/model';

export async function* pullRequestQuerier(repoIdent: RepositoryIdentifier) {
  let page: PullRequest[] = [];
  let pageNumber = 1;

  do {
    page = await queryPullRequestPage(repoIdent, pageNumber);
    page = await queryPullRequestComments(repoIdent, page);
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

async function queryPullRequestComments(
  repoIdent: RepositoryIdentifier,
  page: PullRequest[],
) {
  const { owner, repo } = repoIdent;
  for (const pullRequest of page) {
    const issueComments = await OCTOKIT.rest.issues
      .listComments({
        owner: owner,
        repo: repo,
        issue_number: pullRequest.number,
      })
      .then((res) => res.data.length);
    const pullRequestComments = await OCTOKIT.rest.pulls
      .listReviews({
        owner: owner,
        repo: repo,
        pull_number: pullRequest.number,
      })
      .then((res) => res.data.length);
    pullRequest.comments = issueComments + pullRequestComments;
  }
  return page;
}
