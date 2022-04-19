import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Repository, RepositorySchema } from '../repositories/model/schemas';
import { PullRequestSchema, PullRequest } from './model/schemas';
import { PullRequestService } from './pullRequest.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: PullRequest.name, schema: PullRequestSchema }],
      'data',
    ),
  ],
  providers: [PullRequestService],
  exports: [PullRequestService],
})
export class PullRequestModule {}
