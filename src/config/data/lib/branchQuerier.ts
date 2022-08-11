import { RepositoryIdentifier } from 'src/entities/repositories/model';
import { OCTOKIT } from 'src/lib';
import { querier } from './querier';

export async function* branchQuerier(repoIdent: RepositoryIdentifier) {
  yield* querier<Branch>(repoIdent, queryBranchPage, (branch) => true);
}

async function queryBranchPage(
  repoIdent: RepositoryIdentifier,
  pageNumber: number,
): Promise<Branch[]> {
  const { owner, repo } = repoIdent;
  return OCTOKIT.request('GET /repos/{owner}/{repo}/branches', {
    owner: owner,
    repo: repo,
    per_page: 100,
    page: pageNumber,
  }).then((res) => res.data);
}

type Branch = {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
};
