import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../../../model/schemas';
import { CommitSchema } from '../../../repositories/commits/model/schemas';
import { RepositorySchema } from '../../../repositories/model/schemas';
import { DeveloperSpreadService } from './developerSpread.service';

@Module({
  providers: [DeveloperSpreadService],
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Commit', schema: CommitSchema },
      { name: 'Repository', schema: RepositorySchema },
    ]),
  ],
  controllers: [],
})
export class DeveloperSpreadModule {}
