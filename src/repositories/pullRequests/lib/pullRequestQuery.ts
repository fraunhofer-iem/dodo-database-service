import { OCTOKIT } from '../../../lib/OctokitHelper';
import { RepositoryIdentifier } from '../../model';
import { PullRequest, PullRequestFile, RepositoryFile } from '../model';

enum FileType {
  file = 'blob',
  folder = 'tree',
}

export async function queryPullRequests(
  repoIdent: RepositoryIdentifier,
  pageNumber: number,
): Promise<PullRequest[]> {
  const { owner, repo } = repoIdent;
  return OCTOKIT.rest.pulls
    .list({
      owner: owner,
      repo: repo,
      state: 'all',
      sort: 'created',
      direction: 'asc',
      per_page: 100,
      page: pageNumber,
    })
    .then((res) => res.data);
}

export async function getMergeTargetAndFeatureFiles(
  repoIdent: RepositoryIdentifier,
  pullRequestNumber: number,
  mergeTargetSha: string,
): Promise<{
  featFiles: PullRequestFile[];
  mergeTargetFiles: RepositoryFile[];
}> {
  const featFiles = await getFeatureFiles(repoIdent, pullRequestNumber);

  const mergeTargetFiles = await getAllFilesFromTree(repoIdent, mergeTargetSha);
  return { featFiles, mergeTargetFiles };
}

async function getFeatureFiles(
  repoIdent: RepositoryIdentifier,
  requestNumber: number,
): Promise<PullRequestFile[]> {
  const { owner, repo } = repoIdent;
  return OCTOKIT.rest.pulls
    .listFiles({
      owner: owner,
      repo: repo,
      pull_number: requestNumber,
    })
    .then((res) => res.data);
}

async function getAllFilesFromTree(
  repoIdent: RepositoryIdentifier,
  treeSha: string,
): Promise<RepositoryFile[]> {
  const { owner, repo } = repoIdent;

  const baseTree = await OCTOKIT.rest.git.getTree({
    tree_sha: treeSha,
    owner: owner,
    repo: repo,
    recursive: 'true',
  });

  return baseTree.data.tree.filter((v) => v.type == FileType.file);
}
