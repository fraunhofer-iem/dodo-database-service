import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyObject, Model } from 'mongoose';
import { updateArray } from '../../lib';
import { RepositoryIdentifier } from '../repositories/model';
import { Repository, RepositoryDocument } from '../repositories/model/schemas';
import { queryCommits } from './lib';
import { Commit } from './model';
import { Commit as CommitModel, CommitDocument } from './model/schemas';

@Injectable()
export class CommitService {
  private readonly logger = new Logger(CommitService.name);

  constructor(
    @InjectModel(Repository.name)
    private readonly repoModel: Model<RepositoryDocument>,
    @InjectModel(CommitModel.name)
    private readonly commitModel: Model<CommitDocument>,
  ) {}

  public async storeCommits(
    repoIdent: RepositoryIdentifier,
    repoId: string,
    pageNumber = 1,
  ) {
    const commits: Commit[] = await queryCommits(repoIdent, pageNumber);
    const commitDocuments: CommitDocument[] = [];
    for (const commit of commits) {
      if (commit.author) {
        this.logger.log(`Storing commit ${commit.url}`);
        const commitDocument = await this.commitModel.create(commit);
        commitDocuments.push(commitDocument);
      }
    }

    await updateArray(this.repoModel, repoId, { commits: commitDocuments });

    if (commits.length == 100) {
      this.storeCommits(repoIdent, repoId, pageNumber + 1);
    }
  }

  public async *readAll(filter: AnyObject) {
    let page: CommitDocument[] = [];
    let pageNumber = 0;
    do {
      page = await this.commitModel
        .aggregate()
        .project({ _id: 0, __v: 0 })
        .match(filter)
        .skip(100 * pageNumber)
        .limit(100)
        .exec();
      yield* page;
      pageNumber += 1;
    } while (page.length == 100);
  }
}
