import { OCTOKIT } from '../../../lib';

export async function queryRepos(
  owner: string,
  pageNumber: number,
  repoNames?: string[],
) {
  return OCTOKIT.rest.repos
    .listForOrg({ org: owner, page: pageNumber, per_page: 100 })
    .then((res) => {
      if (repoNames) {
        return res.data.filter((repo) => repoNames.includes(repo.name));
      } else {
        return res.data;
      }
    });
}
