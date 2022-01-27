import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../../model/schemas';
import { RepositorySchema } from '../model/schemas';
import { IssueService } from './issue.service';
import {
  IssueSchema,
  LabelSchema,
  MilestoneSchema,
  IssueEventSchema,
} from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Repository', schema: RepositorySchema },
      { name: 'Issue', schema: IssueSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Label', schema: LabelSchema },
      { name: 'Milestone', schema: MilestoneSchema },
      { name: 'IssueEvent', schema: IssueEventSchema },
    ]),
  ],
  providers: [IssueService],
})
export class IssueModule {}
