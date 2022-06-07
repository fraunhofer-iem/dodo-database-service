import { Commit } from '../../../entities/commits/model';
import { DiffFile } from '../../../entities/diffFiles/model';
import { RepositoryIdentifier } from '../../../entities/repositories/model';
import { OCTOKIT } from '../../../lib';
import { querier } from './querier';

export async function* commitFileQuerier(
  repoIdent: RepositoryIdentifier,
  commit: Commit,
) {
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
