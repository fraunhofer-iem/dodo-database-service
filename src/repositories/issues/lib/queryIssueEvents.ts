import { OCTOKIT } from '../../../lib';
import { RepositoryIdentifier } from '../../model';
import { IssueEvent } from '../../../issueEvents/model';

export async function getIssueEvents(
  repoIdent: RepositoryIdentifier,
  issueNumber: number,
): Promise<IssueEvent[]> {
  const events: IssueEvent[] = [];

  let page: IssueEvent[] = [];
  let pageNumber = 1;
  do {
    page = await queryIssueEvents(repoIdent, issueNumber, pageNumber);
    events.push(...page);
    pageNumber += 1;
  } while (events.length == 100);

  return events;
}

export async function queryIssueEvents(
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
    .then((res) => res.data as any);
}
