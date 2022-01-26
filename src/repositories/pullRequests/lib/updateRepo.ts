import { AnyKeys, Model } from 'mongoose';
import { RepositoryDocument } from 'src/repositories/model/schemas/repository.schema';
import { Diff } from '../model/Diff';
import { DiffDocument } from '../model/schemas/diff.schema';
import { PullRequestDocument } from '../model/schemas/pullRequest.schema';
import { PullRequestFileDocument } from '../model/schemas/pullRequestFile.schema';
import { RepositoryFileDocument } from '../model/schemas/repositoryFile.schema';

interface DiffModels {
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
  const { DiffModel, PullRequest, PullFile, RepoFile } = diffModels;

  const createdDiff = new DiffModel();

  const pullRequest = await new PullRequest(pullRequestDiff.pullRequest).save();

  const changedFiles = await PullFile.create(pullRequestDiff.changedFiles);

  const repoFiles = await RepoFile.create(pullRequestDiff.repoFiles);
  createdDiff.pullRequestFiles = changedFiles;

  createdDiff.repositoryFiles = repoFiles;
  createdDiff.pullRequest = pullRequest;
  const savedDiff = await createdDiff.save();

  await updateRepo(repoId, { diffs: [savedDiff] });
}

async function updateRepo(repoId: string, push: AnyKeys<RepositoryDocument>) {
  await this.repoModel
    .findByIdAndUpdate(repoId, {
      $push: push,
    })
    .exec();
}
