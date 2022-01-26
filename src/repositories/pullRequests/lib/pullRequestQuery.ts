import { Octokit } from 'octokit';
import { RepositoryIdentifier } from 'src/repositories/model/RepositoryDtos';
import { PullRequest, PullRequestFile, RepositoryFile } from '../model';

enum FileType {
  file = 'blob',
  folder = 'tree',
}

export async function getPullRequests(
  octokit: Octokit,
  repoIdent: RepositoryIdentifier,
  pageNumber: number,
): Promise<PullRequest[]> {
  const { owner, repo } = repoIdent;
  return octokit.rest.pulls
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
  octokit: Octokit,
  repoIdent: RepositoryIdentifier,
  pullRequestNumber: number,
  mergeTargetSha: string,
): Promise<{
  featFiles: PullRequestFile[];
  mergeTargetFiles: RepositoryFile[];
}> {
  const featFiles = await getFeatureFiles(
    octokit,
    repoIdent,
    pullRequestNumber,
  );

  const mergeTargetFiles = await getAllFilesFromTree(
    octokit,
    repoIdent,
    mergeTargetSha,
  );
  return { featFiles, mergeTargetFiles };
}

async function getFeatureFiles(
  octokit: Octokit,
  repoIdent: RepositoryIdentifier,
  requestNumber: number,
): Promise<PullRequestFile[]> {
  const { owner, repo } = repoIdent;
  return octokit.rest.pulls
    .listFiles({
      owner: owner,
      repo: repo,
      pull_number: requestNumber,
    })
    .then((res) => res.data);
}

async function getAllFilesFromTree(
  octokit: Octokit,
  repoIdent: RepositoryIdentifier,
  treeSha: string,
): Promise<RepositoryFile[]> {
  const { owner, repo } = repoIdent;

  const baseTree = await octokit.rest.git.getTree({
    tree_sha: treeSha,
    owner: owner,
    repo: repo,
    recursive: 'true',
  });

  return baseTree.data.tree.filter((v) => v.type == FileType.file);
}
