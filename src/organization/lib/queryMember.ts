import { OCTOKIT } from '../../lib';
import { User } from '../../model';

export async function queryMembers(
  owner: string,
  pageNumber: number,
): Promise<User[]> {
  return OCTOKIT.rest.orgs
    .listMembers({
      org: owner,
      page: pageNumber,
      per_page: 100,
    })
    .then((res) => res.data);
}
