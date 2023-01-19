import { RepositoryIdentifier } from '../../../entities/repositories/model';
import { RepositoryFileService } from '../../../entities/repositoryFiles/repositoryFile.service';
import { OCTOKIT } from '../../../lib';
import { Logger } from '@nestjs/common';

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
  const repoFileDocuments = [];
  Logger.debug('Get files from commit tree');
  const files = baseTree.data.tree.filter((v) => v.type === FileType.file);
  if (ref) {
    for (let i = 0; i < files.length; i++) {
      Logger.debug(`${i}/${files.length}`);
      try {
        files[i] = await repoFileService.read({ sha: files[i].sha });
        repoFileDocuments.push(files[i]);
        Logger.log('file stored already');
      } catch {
        Logger.debug('file not stored');
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
        if (typeof files[i]['content'] === 'undefined') {
          Logger.error(`File ${files[i].path} has no content`);
        }
        const repoFileDocument = await repoFileService.create(files[i]);
        repoFileDocuments.push(repoFileDocument);
      }
    }
    return repoFileDocuments;
  }
  return files;
}
