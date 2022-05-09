import { Commit } from 'src/entities/commits/model';
import { DiffFile } from 'src/entities/diffFiles/model';
import { RepositoryIdentifier } from 'src/entities/repositories/model';
import { OCTOKIT } from 'src/lib';
import { querier } from './querier';

export async function* commitFileQuerier(
  repoIdent: RepositoryIdentifier,
  commit: Commit,
) {
  const { owner, repo } = repoIdent;

  yield* querier<DiffFile>(
    repoIdent,
    (repoIdent, pageNumber) =>
      queryCommitFilePage(repoIdent, pageNumber, commit),
    () => true,
  );
}

export async function queryCommitFilePage(
  repoIdent: RepositoryIdentifier,
  pageNumber: number,
  commit: Commit,
): Promise<DiffFile[]> {
  const { owner, repo } = repoIdent;

  return OCTOKIT.rest.repos
    .getCommit({
      owner,
      repo,
      ref: commit.sha,
      per_page: 100,
      page: pageNumber,
    })
    .then((res) => res.data.files as DiffFile[]);
}
