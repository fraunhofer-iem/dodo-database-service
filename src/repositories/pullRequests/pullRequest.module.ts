import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositorySchema } from '../model/schemas';
import {
  DiffSchema,
  PullRequestSchema,
  PullRequestFileSchema,
  RepositoryFileSchema,
} from './model/schemas';

import { PullRequestService } from './pullRequest.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Diff', schema: DiffSchema },
      { name: 'PullRequest', schema: PullRequestSchema },
      { name: 'PullRequestFiles', schema: PullRequestFileSchema },
      { name: 'RepositoryFiles', schema: RepositoryFileSchema },
      { name: 'Repository', schema: RepositorySchema },
    ]),
  ],
  providers: [PullRequestService],
})
export class PullRequestModule {}
