import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositoryModule } from 'src/entities/repositories/repository.module';
import { RepositorySchema } from '../../../entities/repositories/model/schemas';
import { IssueLabels } from './issueLabels.service';

@Module({
  providers: [IssueLabels],
  imports: [
    MongooseModule.forFeature([
      { name: 'Repository', schema: RepositorySchema },
    ]),
    RepositoryModule,
  ],
  exports: [IssueLabels],
  controllers: [],
})
export class IssueLabelsModule {}
