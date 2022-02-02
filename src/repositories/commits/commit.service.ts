import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../model/schemas';
import { updateArray } from '../../lib';
import { RepositoryIdentifier } from '../model';
import { Repository, RepositoryDocument } from '../model/schemas';
import { queryCommits } from './lib';
import { Commit } from './model';
import { Commit as CommitM, CommitDocument } from './model/schemas';
import { fillAuthorModel } from './lib/fillAuthorModel';

@Injectable()
export class CommitService {
  private readonly logger = new Logger(CommitService.name);

  constructor(
    @InjectModel(Repository.name)
    private readonly repoModel: Model<RepositoryDocument>,
    @InjectModel(CommitM.name)
    private readonly commitModel: Model<CommitDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  public async storeCommits(
    repoIdent: RepositoryIdentifier,
    repoId: string,
    pageNumber = 1,
  ) {
    const commits: Commit[] = await fillAuthorModel(
      await queryCommits(repoIdent, pageNumber),
      this.userModel,
    );

    const commitsModel = await this.commitModel.create(commits);

    await updateArray(this.repoModel, repoId, { commits: commitsModel });

    if (commits.length == 100) {
      this.storeCommits(repoIdent, repoId, pageNumber + 1);
    }
  }
}
