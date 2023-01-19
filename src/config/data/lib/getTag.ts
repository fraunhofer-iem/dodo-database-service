import { RepositoryIdentifier } from '../../../entities/repositories/model';
import { OCTOKIT } from '../../../lib';

export async function getTag(
  repoIdent: RepositoryIdentifier,
  tagName: string,
): Promise<any> {
  const { owner, repo } = repoIdent;

  return OCTOKIT.request('GET /repos/{owner}/{repo}/commits/tags/{tag}', {
    owner: owner,
    repo: repo,
    tag: tagName,
  }).then((res) => res.data);
}

export async function getCommit(
  repoIdent: RepositoryIdentifier,
  commitSha: string,
): Promise<any> {
  const { owner, repo } = repoIdent;

  return OCTOKIT.request('GET /repos/{owner}/{repo}/commits/{ref}', {
    owner: owner,
    repo: repo,
    ref: commitSha,
  }).then((res) => res.data);
}
