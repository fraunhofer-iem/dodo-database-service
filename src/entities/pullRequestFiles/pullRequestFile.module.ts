import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PullRequestFile, PullRequestFileSchema } from './model/schemas';
import { PullRequestFileService } from './pullRequestFile.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: PullRequestFile.name, schema: PullRequestFileSchema }],
      'data',
    ),
  ],
  providers: [PullRequestFileService],
  exports: [PullRequestFileService],
})
export class PullRequestFileModule {}
