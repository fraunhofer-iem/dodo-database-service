import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PullRequestFileModule } from '../pullRequestFiles/pullRequestFile.module';
import { PullRequestFileService } from '../pullRequestFiles/pullRequestFile.service';
import { PullRequestModule } from '../pullRequests/pullRequest.module';
import { PullRequestService } from '../pullRequests/pullRequest.service';
import { Repository, RepositorySchema } from '../repositories/model/schemas';
import { RepositoryFileModule } from '../repositoryFiles/repositoryFile.module';
import { RepositoryFileService } from '../repositoryFiles/repositoryFile.service';
import { DiffService } from './diff.service';
import { Diff, DiffSchema } from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Repository.name, schema: RepositorySchema },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: Diff.name,
        imports: [
          PullRequestModule,
          PullRequestFileModule,
          RepositoryFileModule,
        ],
        useFactory: (
          pullRequestService: PullRequestService,
          pullRequestFileService: PullRequestFileService,
          repositoryFileService: RepositoryFileService,
        ) => {
          const schema = DiffSchema;
          schema.pre<Diff>('validate', async function (this: Diff) {
            this.pullRequest = (
              await pullRequestService.readOrCreate(this.pullRequest)
            )._id;
            if (this.pullRequestFiles) {
              for (let i = 0; i < this.pullRequestFiles.length; i++) {
                this.pullRequestFiles[i] = await (
                  await pullRequestFileService.readOrCreate(
                    this.pullRequestFiles[i],
                  )
                )._id;
              }
            }
            if (this.repositoryFiles) {
              for (let i = 0; i < this.repositoryFiles.length; i++) {
                this.repositoryFiles[i] = (
                  await repositoryFileService.readOrCreate(
                    this.repositoryFiles[i],
                  )
                )._id;
              }
            }
          });
          return schema;
        },
        inject: [
          PullRequestService,
          PullRequestFileService,
          RepositoryFileService,
        ],
      },
    ]),
  ],
  providers: [DiffService],
  exports: [DiffService],
})
export class DiffModule {}
