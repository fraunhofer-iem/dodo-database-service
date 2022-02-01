import { Model } from 'mongoose';
import { updateArray } from '../../../lib';
import { RepositoryDocument } from '../../model/schemas';
import { Diff } from '../model';
import {
  RepositoryFileDocument,
  PullRequestFileDocument,
  PullRequestDocument,
  DiffDocument,
} from '../model/schemas';

interface DiffModels {
  Repo: Model<RepositoryDocument>;
  RepoFile: Model<RepositoryFileDocument>;
  PullFile: Model<PullRequestFileDocument>;
  PullRequest: Model<PullRequestDocument>;
  DiffModel: Model<DiffDocument>;
}

export async function savePullRequestDiff(
  repoId: string,
  pullRequestDiff: Diff,
  diffModels: DiffModels,
) {
  const { DiffModel, PullRequest, PullFile, RepoFile, Repo } = diffModels;

  const createdDiff = new DiffModel();

  const pullRequest = await new PullRequest(pullRequestDiff.pullRequest).save();

  const changedFiles = await PullFile.create(pullRequestDiff.changedFiles);

  const repoFiles = await RepoFile.create(pullRequestDiff.repoFiles);
  createdDiff.pullRequestFiles = changedFiles;

  createdDiff.repositoryFiles = repoFiles;
  createdDiff.pullRequest = pullRequest;
  const savedDiff = await createdDiff.save();

  await updateArray(Repo, repoId, { diffs: [savedDiff] });
}
