import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../model/schemas';
import { RepositoryIdentifier } from '../model';
import { Repository, RepositoryDocument } from '../model/schemas';

import { queryIssues, saveIssue } from './lib';
import {
  Issue,
  IssueDocument,
  IssueEvent,
  IssueEventDocument,
  Label,
  LabelDocument,
  Milestone,
  MilestoneDocument,
} from './model/schemas';

@Injectable()
export class IssueService {
  private readonly logger = new Logger(IssueService.name);

  constructor(
    @InjectModel(Repository.name)
    private readonly repoModel: Model<RepositoryDocument>,
    @InjectModel(Issue.name)
    private readonly issueModel: Model<IssueDocument>,
    @InjectModel(User.name)
    private readonly assigneeModel: Model<UserDocument>,
    @InjectModel(Label.name)
    private readonly labelModel: Model<LabelDocument>,
    @InjectModel(Milestone.name)
    private readonly milestoneModel: Model<MilestoneDocument>,
    @InjectModel(IssueEvent.name)
    private readonly issueEventModel: Model<IssueEventDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  public async storeIssues(
    repoIdent: RepositoryIdentifier,
    repoId: string,
    pageNumber = 1,
  ) {
    const issues = await queryIssues(repoIdent, pageNumber);
    for (const issue of issues) {
      await saveIssue(
        repoIdent,
        {
          RepoModel: this.repoModel,
          IssueModel: this.issueModel,
          LabelModel: this.labelModel,
          AssigneeModel: this.assigneeModel,
          MilestoneModel: this.milestoneModel,
          IssueEventModel: this.issueEventModel,
          UserModel: this.userModel,
        },
        issue,
        repoId,
      );
    }

    if (issues.length == 100) {
      this.storeIssues(repoIdent, repoId, pageNumber + 1);
    }
  }
}
