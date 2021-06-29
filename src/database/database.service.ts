import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DiffDocument } from './schemas/diff.schema';
import { PullRequestDocument } from './schemas/pullRequest.schema';
import { RepositoryDocument } from './schemas/repository.schema';

@Injectable()
export class DatabaseService {
  constructor(
    // @InjectModel('Repository')
    // private readonly repoModel: Model<RepositoryDocument>,
    // @InjectModel('PullRequest')
    // private readonly pullRequestModel: Model<PullRequestDocument>,
    @InjectModel('Diff') private readonly diffModel: Model<DiffDocument>,
  ) {}

  async savePullRequestDiff() {
    const createdDiff = new this.diffModel();
    // const pullRequest = new this.pullRequestModel();
    // const repo = new this.repoModel();
    // repo.number = Math.random();
    // pullRequest.number = 32;
    // createdDiff.pullRequest = pullRequest;
    // createdDiff.repository = repo;
    return createdDiff.save();
  }
}
