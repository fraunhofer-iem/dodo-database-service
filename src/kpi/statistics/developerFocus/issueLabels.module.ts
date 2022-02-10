import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositorySchema } from '../../../entities/repositories/model/schemas';
import { IssueLabels } from './issueLabels.service';

@Module({
  providers: [IssueLabels],
  imports: [
    MongooseModule.forFeature([
      { name: 'Repository', schema: RepositorySchema },
    ]),
  ],
  exports: [IssueLabels],
  controllers: [],
})
export class IssueLabelsModule {}
