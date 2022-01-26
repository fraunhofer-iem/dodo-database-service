import { Label } from 'src/database/schemas/labels.schema';
import { OCTOKIT } from 'src/lib/OctokitHelper';
import { RepositoryIdentifier } from 'src/repositories/model';
import { Issue } from '../model';

export async function getIssues(
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
