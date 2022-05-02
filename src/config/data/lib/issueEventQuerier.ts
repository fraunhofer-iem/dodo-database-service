import { IssueEvent } from 'src/entities/issueEvents/model';
import { RepositoryIdentifier } from 'src/entities/repositories/model';
import { OCTOKIT } from '../../../lib';
import { querier } from './querier';

export async function* issueEventQuerier(
  repoIdent: RepositoryIdentifier,
  issueNumber: number,
) {
  yield* querier<IssueEvent>(
    repoIdent,
    (repoIdent, pageNumber) =>
      queryIssueEventPage(repoIdent, issueNumber, pageNumber),
    () => true,
  );
}

export async function queryIssueEventPage(
  repoIdent: RepositoryIdentifier,
  issueNumber: number,
  pageNumber: number,
): Promise<IssueEvent[]> {
  const { owner, repo } = repoIdent;

  return OCTOKIT.rest.issues
    .listEvents({
      owner: owner,
      repo: repo,
      issue_number: issueNumber,
      per_page: 100,
      page: pageNumber,
    })
    .then((res) => res.data as IssueEvent[]);
}
