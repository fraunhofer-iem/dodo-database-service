import { Commit } from 'src/entities/commits/model';
import { RepositoryIdentifier } from 'src/entities/repositories/model';
import { OCTOKIT } from 'src/lib';
import { querier } from './querier';

export async function* commitQuerier(repoIdent: RepositoryIdentifier) {
  yield* querier<Commit>(
    repoIdent,
    queryCommitPage,
    (commit) => 'author' in commit,
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
          url: commit.url,
          author: commit.author,
          timestamp: commit.commit.committer.date,
          message: commit.commit.message,
        };
      });
    });
}
