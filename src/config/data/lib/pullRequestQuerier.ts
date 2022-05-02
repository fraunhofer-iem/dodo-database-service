import { PullRequest } from 'src/entities/pullRequests/model';
import { RepositoryIdentifier } from 'src/entities/repositories/model';
import { OCTOKIT } from '../../../lib';
import { querier } from './querier';

export async function* pullRequestQuerier(repoIdent: RepositoryIdentifier) {
  yield* querier<PullRequest>(
    repoIdent,
    async (repoIdent, pageNumber) => {
      let page = await queryPullRequestPage(repoIdent, pageNumber);
      return queryPullRequestComments(repoIdent, page);
    },
    (pr) => !('pull_request' in pr),
  );
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
