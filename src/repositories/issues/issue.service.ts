import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '../../model/schemas';
import { RepositoryIdentifier } from '../model';
import { RepositoryDocument } from '../model/schemas';

import { getIssues, saveIssue } from './lib';
import {
  IssueDocument,
  IssueEventDocument,
  LabelDocument,
  MilestoneDocument,
} from './model/schemas';

@Injectable()
export class IssueService {
  private readonly logger = new Logger(IssueService.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
    @InjectModel('Issue')
    private readonly issueModel: Model<IssueDocument>,
    @InjectModel('User')
    private readonly assigneeModel: Model<UserDocument>,
    @InjectModel('Label')
    private readonly labelModel: Model<LabelDocument>,
    @InjectModel('Milestone')
    private readonly milestoneModel: Model<MilestoneDocument>,
    @InjectModel('IssueEvent')
    private readonly issueEventModel: Model<IssueEventDocument>,
  ) {}

  public async storeIssues(repoIdent: RepositoryIdentifier, repoId: string) {
    this.processIssues(repoIdent, repoId, 1);
  }

  private async processIssues(
    repoIdent: RepositoryIdentifier,
    repoId: string,
    pageNumber: number,
  ) {
    const issues = await getIssues(repoIdent, pageNumber);
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
        },
        issue,
        repoId,
      );
    }

    if (issues.length == 100) {
      this.processIssues(repoIdent, repoId, pageNumber + 1);
    }
  }
}
