import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Repository, RepositorySchema } from '../model/schemas';
import {
  DiffSchema,
  PullRequestSchema,
  PullRequestFileSchema,
  RepositoryFileSchema,
  Diff,
  PullRequest,
  PullRequestFile,
  RepositoryFile,
} from './model/schemas';

import { PullRequestService } from './pullRequest.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Diff.name, schema: DiffSchema },
      { name: PullRequest.name, schema: PullRequestSchema },
      { name: PullRequestFile.name, schema: PullRequestFileSchema },
      { name: RepositoryFile.name, schema: RepositoryFileSchema },
      { name: Repository.name, schema: RepositorySchema },
    ]),
  ],
  providers: [PullRequestService],
  exports: [PullRequestService],
})
export class PullRequestModule {}
