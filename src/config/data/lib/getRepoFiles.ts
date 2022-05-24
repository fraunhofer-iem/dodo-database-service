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
  ref?: string,
) {
  const { owner, repo } = repoIdent;

  const baseTree = await OCTOKIT.rest.git.getTree({
    tree_sha: sha,
    owner: owner,
    repo: repo,
    recursive: 'true',
  });

  const files = baseTree.data.tree.filter((v) => v.type == FileType.file);
  if (ref) {
    for (const file of files) {
      await OCTOKIT.rest.repos
        .getContent({
          owner: owner,
          repo: repo,
          path: file.path,
          ref: ref,
        })
        .then((res) => res.data)
        .then((data) => {
          file['content'] = data['content'];
        });
    }
  }

  return files;
}
