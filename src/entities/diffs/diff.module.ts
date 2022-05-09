import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiffFileModule } from '../diffFiles/diffFile.module';
import { DiffFileService } from '../diffFiles/diffFile.service';
import { PullRequestModule } from '../pullRequests/pullRequest.module';
import { PullRequestService } from '../pullRequests/pullRequest.service';
import { RepositoryFileModule } from '../repositoryFiles/repositoryFile.module';
import { RepositoryFileService } from '../repositoryFiles/repositoryFile.service';
import { DiffService } from './diff.service';
import { Diff, DiffSchema } from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeatureAsync(
      [
        {
          name: Diff.name,
          imports: [PullRequestModule, DiffFileModule, RepositoryFileModule],
          useFactory: (
            pullRequestService: PullRequestService,
            diffFileService: DiffFileService,
            repositoryFileService: RepositoryFileService,
          ) => {
            const schema = DiffSchema;
            schema.pre<Diff>('validate', async function (this: Diff) {
              this.pullRequest = (
                await pullRequestService.readOrCreate(this.pullRequest)
              )._id;
              if (this.files) {
                for (let i = 0; i < this.files.length; i++) {
                  this.files[i] = await (
                    await diffFileService.readOrCreate(this.files[i])
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
          inject: [PullRequestService, DiffFileService, RepositoryFileService],
        },
      ],
      'data',
    ),
  ],
  providers: [DiffService],
  exports: [DiffService],
})
export class DiffModule {}
