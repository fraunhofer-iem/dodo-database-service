import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositorySchema } from '../../../entities/repositories/model/schemas';
import { DeveloperFocusService } from './developerFocus.service';

@Module({
  providers: [DeveloperFocusService],
  imports: [
    MongooseModule.forFeature([
      { name: 'Repository', schema: RepositorySchema },
    ]),
  ],
  controllers: [],
})
export class DeveloperFocusModule {}
