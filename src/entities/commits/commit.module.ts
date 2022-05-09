import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommitService } from './commit.service';
import { Commit, CommitSchema } from './model/schemas';
import { UserModule } from '../users/user.module';
import { UserService } from '../users/user.service';
import { RepositoryModule } from '../repositories/repository.module';
import { RepositoryService } from '../repositories/repository.service';

@Module({
  imports: [
    MongooseModule.forFeatureAsync(
      [
        {
          name: Commit.name,
          imports: [UserModule, RepositoryModule],
          useFactory: (
            userService: UserService,
            repoService: RepositoryService,
          ) => {
            const schema = CommitSchema;
            schema.pre<Commit>('validate', async function (this: Commit) {
              this.author = (await userService.readOrCreate(this.author))._id;
              this.repo = (await repoService.readOrCreate(this.repo))._id;
            });
            return schema;
          },
          inject: [UserService, RepositoryService],
        },
      ],
      'data',
    ),
  ],
  providers: [CommitService],
  controllers: [],
  exports: [CommitService],
})
export class CommitModule {}
