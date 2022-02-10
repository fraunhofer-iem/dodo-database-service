import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { updateArray } from '../../lib';
import { RepositoryIdentifier } from '../model';
import { RepositoryDocument } from '../model/schemas';
import { queryCommits } from './lib';
import { Commit } from './model';
import { CommitDocument } from './model/schemas';

@Injectable()
export class CommitService {
  private readonly logger = new Logger(CommitService.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
    @InjectModel('Commit')
    private readonly commitModel: Model<CommitDocument>,
  ) {}

  public async storeCommits(
    repoIdent: RepositoryIdentifier,
    repoId: string,
    pageNumber = 1,
  ) {
    const commits: Commit[] = await queryCommits(repoIdent, pageNumber);

    //TODO: check what happens here. do we automatically create a user or do we
    // have to do this manually?
    const commitsModel = await this.commitModel.create(commits);

    await updateArray(this.repoModel, repoId, { commits: commitsModel });

    if (commits.length == 100) {
      this.storeCommits(repoIdent, repoId, pageNumber + 1);
    }
  }
}
