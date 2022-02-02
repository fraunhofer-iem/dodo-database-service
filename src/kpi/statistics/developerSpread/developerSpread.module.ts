import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../../../model/schemas';
import { CommitSchema } from '../../../repositories/commits/model/schemas';
import { RepositorySchema } from '../../../repositories/model/schemas';
import { DeveloperSpreadController } from './developerSpread.controller';
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
  controllers: [DeveloperSpreadController],
})
export class DeveloperSpreadModule {}
