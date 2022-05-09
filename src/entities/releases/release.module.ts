import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositoryModule } from '../repositories/repository.module';
import { RepositoryService } from '../repositories/repository.service';
import { Release, ReleaseSchema } from './model/schemas';
import { ReleaseService } from './release.service';

@Module({
  imports: [
    MongooseModule.forFeatureAsync(
      [
        {
          name: Release.name,
          imports: [RepositoryModule],
          useFactory: (repoService: RepositoryService) => {
            const schema = ReleaseSchema;
            schema.pre<Release>('validate', async function (this: Release) {
              this.repo = (await repoService.readOrCreate(this.repo))._id;
            });
            return schema;
          },
          inject: [RepositoryService],
        },
      ],
      'data',
    ),
  ],
  providers: [ReleaseService],
  exports: [ReleaseService],
})
export class ReleaseModule {}
