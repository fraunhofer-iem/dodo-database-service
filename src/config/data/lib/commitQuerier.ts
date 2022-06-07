import { Commit } from '../../../entities/commits/model';
import { RepositoryIdentifier } from '../../../entities/repositories/model';
import { OCTOKIT } from '../../../lib';
import { querier } from './querier';

export async function* commitQuerier(repoIdent: RepositoryIdentifier) {
  yield* querier<Commit>(
    repoIdent,
    queryCommitPage,
    (commit) => 'author' in commit && commit.author !== null,
  );
}

async function queryCommitPage(
  repoIdent: RepositoryIdentifier,
  pageNumber: number,
) {
  const { owner, repo } = repoIdent;
  return OCTOKIT.rest.repos
    .listCommits({
      owner: owner,
      repo: repo,
      per_page: 100,
      page: pageNumber,
    })
    .then((res) => {
      return res.data.map((commit) => {
        return {
          sha: commit.sha,
          url: commit.url,
          author: commit.author,
          timestamp: commit.commit.author.date,
          message: commit.commit.message,
        };
      });
    });
}
