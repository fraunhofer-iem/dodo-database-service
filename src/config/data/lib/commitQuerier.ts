import { ReleaseDocument } from 'src/entities/releases/model/schemas';
import { Commit } from '../../../entities/commits/model';
import { RepositoryIdentifier } from '../../../entities/repositories/model';
import { OCTOKIT } from '../../../lib';
import { querier } from './querier';

export async function* commitQuerier(
  repoIdent: RepositoryIdentifier,
  release: ReleaseDocument,
  since?: Date,
) {
  yield* querier<Commit>(
    repoIdent,
    (repoIdent, pageNumber) =>
      queryCommitPage(
        repoIdent,
        pageNumber,
        release.name,
        since ? since.toISOString() : undefined,
        new Date(release.published_at).toISOString(),
      ),
    (commit) => 'author' in commit && commit.author !== null,
  );
}

async function queryCommitPage(
  repoIdent: RepositoryIdentifier,
  pageNumber: number,
  sha?: string,
  since?: string,
  until?: string,
) {
  const { owner, repo } = repoIdent;

  return OCTOKIT.rest.repos
    .listCommits({
      owner: owner,
      repo: repo,
      per_page: 100,
      page: pageNumber,
      sha: sha,
      until: until,
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
