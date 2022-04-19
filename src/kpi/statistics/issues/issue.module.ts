import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositorySchema } from '../../../entities/repositories/model/schemas';
import { IssueService } from './issue.service';

@Module({
  providers: [IssueService],
  imports: [
    MongooseModule.forFeature(
      [{ name: 'Repository', schema: RepositorySchema }],
      'data',
    ),
  ],
  controllers: [],
})
export class IssueModule {}
