import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../model/schemas';
import { Repository, RepositorySchema } from '../model/schemas';
import { IssueService } from './issue.service';
import {
  IssueSchema,
  LabelSchema,
  MilestoneSchema,
  IssueEventSchema,
  Issue,
  Label,
  Milestone,
  IssueEvent,
} from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Repository.name, schema: RepositorySchema },
      { name: Issue.name, schema: IssueSchema },
      { name: User.name, schema: UserSchema },
      { name: Label.name, schema: LabelSchema },
      { name: Milestone.name, schema: MilestoneSchema },
      { name: IssueEvent.name, schema: IssueEventSchema },
    ]),
  ],
  providers: [IssueService],
  exports: [IssueService],
})
export class IssueModule {}
