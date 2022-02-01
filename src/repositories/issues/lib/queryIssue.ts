import { OCTOKIT } from '../../../lib';
import { RepositoryIdentifier } from '../../model';
import { Issue, Label } from '../model';

export async function queryIssues(
  repoIdent: RepositoryIdentifier,
  pageNumber: number,
): Promise<Partial<Issue>[]> {
  const { owner, repo } = repoIdent;
  return OCTOKIT.rest.issues
    .listForRepo({
      owner: owner,
      repo: repo,
      filter: 'assigned',
      state: 'all',
      per_page: 100,
      page: pageNumber,
    })
    .then((res) =>
      res.data
        .filter((issue) => {
          return !('pull_request' in issue);
        })
        .map((issue) => {
          issue.labels = issue.labels.filter((label) => {
            return typeof label != 'string';
          });
          return { ...issue, labels: issue.labels as Label[] };
        }),
    );
}
