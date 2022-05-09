import { PullRequest } from 'src/entities/pullRequests/model';
import { OCTOKIT } from '../../../lib';
import { RepositoryIdentifier } from 'src/entities/repositories/model';

enum FileType {
  file = 'blob',
  folder = 'tree',
}

export async function getRepoFiles(
  repoIdent: RepositoryIdentifier,
  sha: string,
) {
  const { owner, repo } = repoIdent;

  const baseTree = await OCTOKIT.rest.git.getTree({
    tree_sha: sha,
    owner: owner,
    repo: repo,
    recursive: 'true',
  });

  return baseTree.data.tree.filter((v) => v.type == FileType.file);
}
