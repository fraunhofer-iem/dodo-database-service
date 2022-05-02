import { PullRequestFile } from 'src/entities/pullRequestFiles/model';
import { PullRequest } from 'src/entities/pullRequests/model/schemas';
import { RepositoryIdentifier } from 'src/entities/repositories/model';
import { OCTOKIT } from '../../../lib';

export async function getPullRequestFiles(
  repoIdent: RepositoryIdentifier,
  pullRequest: PullRequest,
) {
  const pullRequestFiles: PullRequestFile[] = [];
  let page: PullRequestFile[] = [];
  let pageNumber = 1;

  do {
    page = await queryPullRequestFilePage(repoIdent, pullRequest, pageNumber);
    pullRequestFiles.push(...page);
    pageNumber += 1;
  } while (page.length == 100);

  return pullRequestFiles;
}

async function queryPullRequestFilePage(
  repoIdent: RepositoryIdentifier,
  pullRequest: PullRequest,
  pageNumber: number,
) {
  const { owner, repo } = repoIdent;
  return OCTOKIT.rest.pulls
    .listFiles({
      owner: owner,
      repo: repo,
      pull_number: pullRequest.number,
      per_page: 100,
      page: pageNumber,
    })
    .then((res) => res.data);
}
