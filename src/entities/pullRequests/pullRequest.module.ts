import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Repository, RepositorySchema } from '../repositories/model/schemas';
import {
  DiffSchema,
  PullRequestSchema,
  PullRequestFileSchema,
  // RepositoryFileSchema,
  Diff,
  PullRequest,
  PullRequestFile,
  // RepositoryFile,
} from './model/schemas';
import {
  RepositoryFileSchema,
  RepositoryFile,
} from '../repositoryFiles/model/schemas';
import { RepositoryFileModule } from '../repositoryFiles/repositoryFile.module';
import { RepositoryFileService } from '../repositoryFiles/repositoryFile.service';
import { PullRequestService } from './pullRequest.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Diff.name, schema: DiffSchema },
      { name: PullRequest.name, schema: PullRequestSchema },
      { name: PullRequestFile.name, schema: PullRequestFileSchema },
      { name: RepositoryFile.name, schema: RepositoryFileSchema },
      // this has to be outsourced from the RepositoryFileService
      { name: Repository.name, schema: RepositorySchema },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: Diff.name,
        imports: [RepositoryFileModule],
        useFactory: (repositoryFileService: RepositoryFileService) => {
          const schema = DiffSchema;
          schema.pre<Diff>('validate', async function (this: Diff) {
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
        inject: [RepositoryFileService],
      },
    ]),
  ],
  providers: [PullRequestService],
  exports: [PullRequestService],
})
export class PullRequestModule {}
