import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositorySchema } from '../model/schemas';
import { CommitService } from './commit.service';
import { CommitSchema } from './model/schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Repository', schema: RepositorySchema },
      { name: 'Commit', schema: CommitSchema },
    ]),
  ],
  providers: [CommitService],
  controllers: [],
})
export class CommitModule {}
