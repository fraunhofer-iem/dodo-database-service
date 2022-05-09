import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommitService } from './commit.service';
import { Commit, CommitSchema } from './model/schemas';
import { UserModule } from '../users/user.module';
import { UserService } from '../users/user.service';
import { RepositoryModule } from '../repositories/repository.module';
import { RepositoryService } from '../repositories/repository.service';
import { DiffFileService } from '../diffFiles/diffFile.service';
import { DiffFileModule } from '../diffFiles/diffFile.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync(
      [
        {
          name: Commit.name,
          imports: [UserModule, RepositoryModule, DiffFileModule],
          useFactory: (
            userService: UserService,
            repoService: RepositoryService,
            diffFileService: DiffFileService,
          ) => {
            const schema = CommitSchema;
            schema.pre<Commit>('validate', async function (this: Commit) {
              this.author = (await userService.readOrCreate(this.author))._id;
              this.repo = (await repoService.readOrCreate(this.repo))._id;
              for (let i = 0; i < this.files.length; i++) {
                this.files[i] = (
                  await diffFileService.readOrCreate(this.files[i])
                )._id;
              }
            });
            return schema;
          },
          inject: [UserService, RepositoryService, DiffFileService],
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
