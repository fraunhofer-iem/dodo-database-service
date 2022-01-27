import { OCTOKIT } from 'src/lib/OctokitHelper';
import { RepositoryIdentifier } from 'src/repositories/model';
import { Commit } from '../model';

export async function getCommits(
  repoIdent: RepositoryIdentifier,
  pageNumber: number,
): Promise<Commit[]> {
  const { owner, repo } = repoIdent;
  return OCTOKIT.rest.repos
    .listCommits({
      owner: owner,
      repo: repo,
      per_page: 100,
      page: pageNumber,
    })
    .then((res) => {
      return res.data.map((commit) => {
        return {
          url: commit.url,
          author: commit.author,
          timestamp: commit.commit.committer.date,
          message: commit.commit.message,
        };
      });
    });
}
