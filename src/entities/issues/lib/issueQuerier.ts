import { OCTOKIT } from '../../../lib';
import { RepositoryIdentifier } from '../../repositories/model';
import { Issue } from '../model';
import { Label } from '../../labels/model';

export async function* issueQuerier(repoIdent: RepositoryIdentifier) {
  let page: Issue[] = [];
  let pageNumber = 1;

  do {
    page = await queryIssuePage(repoIdent, pageNumber);
    yield* page.filter((issue) => !('pull_request' in issue));
    pageNumber += 1;
  } while (page.length == 100);
}

async function queryIssuePage(
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
