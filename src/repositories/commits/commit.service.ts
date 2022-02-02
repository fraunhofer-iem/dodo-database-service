import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../model/schemas';
import { updateArray, retrieveDocument, createDocument } from '../../lib';
import { RepositoryIdentifier } from '../model';
import { Repository, RepositoryDocument } from '../model/schemas';
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
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  public async storeCommits(
    repoIdent: RepositoryIdentifier,
    repoId: string,
    pageNumber = 1,
  ) {
    const commits: Commit[] = await queryCommits(repoIdent, pageNumber);
    const commitDocuments: CommitDocument[] = [];
    for (const commit of commits) {
      let author: UserDocument;
      if (commit.author) {
        author = await retrieveDocument(this.userModel, {
          id: commit.author.id,
        });
        if (!author) {
          author = await createDocument(this.userModel, commit.author);
        }
        commit.author = author;
        const commitDocument = new this.commitModel(commit);
        commitDocuments.push(commitDocument);
      }
    }

    await updateArray(this.repoModel, repoId, { commits: commitDocuments });

    if (commits.length == 100) {
      this.storeCommits(repoIdent, repoId, pageNumber + 1);
    }
  }
}
