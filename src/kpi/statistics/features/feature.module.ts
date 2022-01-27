import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositorySchema } from '../../../repositories/model/schemas';
import { DiffService } from './diff.service';
import { FeatureCompletionService } from './featureCompletion.service';

@Module({
  providers: [DiffService, FeatureCompletionService],
  imports: [
    MongooseModule.forFeature([
      { name: 'Repository', schema: RepositorySchema },
    ]),
  ],
  controllers: [],
})
export class FeatureModule {}
