import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IssueEventModule } from '../issueEvents/issueEvent.module';
import { IssueEventService } from '../issueEvents/issueEvent.service';
import { LabelModule } from '../labels/label.module';
import { LabelService } from '../labels/label.service';
import { MilestoneModule } from '../milestones/milestone.module';
import { MilestoneService } from '../milestones/milestone.service';
import { RepositoryModule } from '../repositories/repository.module';
import { RepositoryService } from '../repositories/repository.service';
import { UserModule } from '../users/user.module';
import { UserService } from '../users/user.service';
import { IssueService } from './issue.service';
import { IssueSchema, Issue } from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeatureAsync(
      [
        {
          name: Issue.name,
          imports: [
            UserModule,
            RepositoryModule,
            IssueEventModule,
            LabelModule,
            MilestoneModule,
          ],
          useFactory: (
            userService: UserService,
            repoService: RepositoryService,
            issueEventService: IssueEventService,
            labelService: LabelService,
            milestoneService: MilestoneService,
          ) => {
            const schema = IssueSchema;
            schema.pre<Issue>('validate', async function (this: Issue) {
              this.user = (await userService.readOrCreate(this.user))._id;
              if (this.assignee) {
                this.assignee = (
                  await userService.readOrCreate(this.assignee)
                )._id;
              }
              if (this.assignees) {
                for (let i = 0; i < this.assignees.length; i++) {
                  this.assignees[i] = (
                    await userService.readOrCreate(this.assignees[i])
                  )._id;
                }
              }
              if (this.closed_by) {
                this.closed_by = (
                  await userService.readOrCreate(this.closed_by)
                )._id;
              }
            });
            schema.pre<Issue>('validate', async function (this: Issue) {
              this.repo = (await repoService.readOrCreate(this.repo))._id;
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
                  await labelService.readOrCreate(this.labels[i])
                )._id;
              }
            });
            schema.pre<Issue>('validate', async function (this: Issue) {
              if (this.milestone) {
                this.milestone = (
                  await milestoneService.readOrCreate(this.milestone)
                )._id;
              }
            });
            return schema;
          },
          inject: [
            UserService,
            RepositoryService,
            IssueEventService,
            LabelService,
            MilestoneService,
          ],
        },
      ],
      'data',
    ),
  ],
  providers: [IssueService],
  exports: [IssueService],
})
export class IssueModule {}
