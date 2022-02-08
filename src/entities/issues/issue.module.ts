import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IssueEventModule } from '../issueEvents/issueEvent.module';
import { IssueEventService } from '../issueEvents/issueEvent.service';
import { LabelModule } from '../labels/label.module';
import { LabelService } from '../labels/label.service';
import { MilestoneModule } from '../milestones/milestone.module';
import { MilestoneService } from '../milestones/milestone.service';
import { UserModule } from '../users/user.module';
import { UserService } from '../users/user.service';
import { Repository, RepositorySchema } from '../repositories/model/schemas';
import { IssueService } from './issue.service';
import { IssueSchema, Issue } from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Repository.name, schema: RepositorySchema },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: Issue.name,
        imports: [UserModule, IssueEventModule, LabelModule, MilestoneModule],
        useFactory: (
          userService: UserService,
          issueEventService: IssueEventService,
          labelService: LabelService,
          milestoneService: MilestoneService,
        ) => {
          const schema = IssueSchema;
          schema.pre<Issue>('validate', async function (this: Issue) {
            this.user = (await userService.validate(this.user))._id;
            if (this.assignee) {
              this.assignee = (await userService.validate(this.assignee))._id;
            }
            if (this.assignees) {
              for (let i = 0; i < this.assignees.length; i++) {
                this.assignees[i] = (
                  await userService.validate(this.assignees[i])
                )._id;
              }
            }
            if (this.closed_by) {
              this.closed_by = (await userService.validate(this.closed_by))._id;
            }
          });
          schema.pre<Issue>('validate', async function (this: Issue) {
            for (let i = 0; i < this.events.length; i++) {
              this.events[i] = (
                await issueEventService.create(this.events[i])
              )._id;
            }
          });
          schema.pre<Issue>('validate', async function (this: Issue) {
            for (let i = 0; i < this.labels.length; i++) {
              this.labels[i] = (
                await labelService.validate(this.labels[i])
              )._id;
            }
          });
          schema.pre<Issue>('validate', async function (this: Issue) {
            if (this.milestone) {
              this.milestone = (
                await milestoneService.validate(this.milestone)
              )._id;
            }
          });
          return schema;
        },
        inject: [
          UserService,
          IssueEventService,
          LabelService,
          MilestoneService,
        ],
      },
    ]),
  ],
  providers: [IssueService],
  exports: [IssueService],
})
export class IssueModule {}
