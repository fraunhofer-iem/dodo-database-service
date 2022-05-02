import { OCTOKIT } from '../../../lib';
import { RepositoryIdentifier } from '../../../entities/repositories/model';
import { Issue } from '../../../entities/issues/model';
import { Label } from '../../../entities/labels/model';
import { querier } from './querier';

export async function* issueQuerier(repoIdent: RepositoryIdentifier) {
  yield* querier<Issue>(
    repoIdent,
    queryIssuePage,
    (issue) => !('pull_request' in issue),
  );
}

export async function queryIssuePage(
  repoIdent: RepositoryIdentifier,
  pageNumber: number,
) {
  const { owner, repo } = repoIdent;
  return OCTOKIT.rest.issues
    .listForRepo({
      owner: owner,
      repo: repo,
      state: 'all',
      per_page: 100,
      page: pageNumber,
    })
    .then((res) =>
      res.data.map((issue) => {
        issue.labels = issue.labels.filter((label) => {
          return typeof label != 'string';
        });
        return { ...issue, labels: issue.labels as Label[], events: [] };
      }),
    );
}
