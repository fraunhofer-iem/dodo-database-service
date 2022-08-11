import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositoryModule } from '../repositories/repository.module';
import { RepositoryService } from '../repositories/repository.service';
import { RepositoryFileModule } from '../repositoryFiles/repositoryFile.module';
import { RepositoryFileService } from '../repositoryFiles/repositoryFile.service';
import { Release, ReleaseSchema } from './model/schemas';
import { ReleaseService } from './release.service';

@Module({
  imports: [
    MongooseModule.forFeatureAsync(
      [
        {
          name: Release.name,
          imports: [RepositoryModule, RepositoryFileModule],
          useFactory: (
            repoService: RepositoryService,
            repositoryFileService: RepositoryFileService,
          ) => {
            const schema = ReleaseSchema;
            schema.pre<Release>('validate', async function (this: Release) {
              if (
                this.repo.hasOwnProperty('owner') &&
                this.repo.hasOwnProperty('repo')
              ) {
                this.repo = (await repoService.readOrCreate(this.repo))._id;
              }

              for (let i = 0; i < this.files.length; i++) {
                if (this.repo.hasOwnProperty('sha')) {
                  this.files[i] = (
                    await repositoryFileService.readOrCreate(this.files[i])
                  )._id;
                }
              }
            });
            return schema;
          },
          inject: [RepositoryService, RepositoryFileService],
        },
      ],
      'data',
    ),
  ],
  providers: [ReleaseService],
  exports: [ReleaseService],
})
export class ReleaseModule {}
