import { OCTOKIT } from '../../../lib';
import { RepositoryIdentifier } from 'src/entities/repositories/model';
import { RepositoryFileService } from 'src/entities/repositoryFiles/repositoryFile.service';

enum FileType {
  file = 'blob',
  folder = 'tree',
}

export async function getRepoFiles(
  repoIdent: RepositoryIdentifier,
  sha: string,
  ref?: string,
  repoFileService?: RepositoryFileService,
) {
  const { owner, repo } = repoIdent;

  const baseTree = await OCTOKIT.rest.git.getTree({
    tree_sha: sha,
    owner: owner,
    repo: repo,
    recursive: 'true',
  });
  const files = baseTree.data.tree.filter((v) => v.type === FileType.file);
  if (ref) {
    for (let i = 0; i < files.length; i++) {
      try {
        files[i] = await repoFileService.read({ sha: files[i].sha });
      } catch {
        const data = await OCTOKIT.rest.repos
          .getContent({
            owner: owner,
            repo: repo,
            path: files[i].path,
            ref: ref,
          })
          .then((res) => res.data);
        files[i]['content'] = (data as any).content;
        files[i]['encoding'] = (data as any).encoding;
      }
    }
  }
  return files;
}
