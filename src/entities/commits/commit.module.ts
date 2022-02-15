import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Repository, RepositorySchema } from '../repositories/model/schemas';
import { CommitService } from './commit.service';
import { Commit, CommitSchema } from './model/schemas';
import { UserModule } from '../users/user.module';
import { UserService } from '../users/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Repository.name, schema: RepositorySchema },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: Commit.name,
        imports: [UserModule],
        useFactory: (userService: UserService) => {
          const schema = CommitSchema;
          schema.pre<Commit>('validate', async function (this: Commit) {
            this.author = (await userService.readOrCreate(this.author))._id;
          });
          return schema;
        },
        inject: [UserService],
      },
    ]),
  ],
  providers: [CommitService],
  controllers: [],
  exports: [CommitService],
})
export class CommitModule {}
