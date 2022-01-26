import { OCTOKIT } from 'src/lib/OctokitHelper';
import { RepositoryIdentifier } from 'src/repositories/model';
import { IssueEvent } from '../model';

export async function queryIssueEvents(
  repoIdent: RepositoryIdentifier,
  issueNumber: number,
  pageNumber: number,
): Promise<Partial<IssueEvent>[]> {
  const { owner, repo } = repoIdent;

  return OCTOKIT.rest.issues
    .listEvents({
      owner: owner,
      repo: repo,
      issue_number: issueNumber,
      per_page: 100,
      page: pageNumber,
    })
    .then((res) => res.data);
}
