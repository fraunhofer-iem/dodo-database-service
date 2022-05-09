import { Commit } from 'src/entities/commits/model';
import { RepositoryIdentifier } from 'src/entities/repositories/model';
import { OCTOKIT } from '../../../lib';

export async function getTag(
  repoIdent: RepositoryIdentifier,
  tagName: string,
): Promise<any> {
  const { owner, repo } = repoIdent;

  const request = await OCTOKIT.request(
    'GET /repos/{owner}/{repo}/commits/tags/{tag}',
    {
      owner: owner,
      repo: repo,
      tag: tagName,
    },
  );

  return request.data;
}
