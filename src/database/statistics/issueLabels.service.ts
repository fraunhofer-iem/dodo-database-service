import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RepositoryNameDto } from 'src/github-api/model/Repository';
import { issueLabel } from 'src/github-api/model/IssueLabels';
import { RepositoryDocument } from '../schemas/repository.schema';

@Injectable()
export class IssueLabels {
  private readonly logger = new Logger(IssueLabels.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
  ) {}

  async getRepoLabels(
    repoId: string,
    loginFilter?: string[],
    userLimit?: number,
  ) {
    const limit = userLimit ? userLimit : 100;

    const getIssuesWithEvents = {
      from: 'issuewithevents',
      localField: 'issuesWithEvents',
      foreignField: '_id',
      as: 'expandedIssuesWithEvents',
    };

    const getIssueEventTypes = {
      from: 'issueeventtypes',
      localField: 'expandedIssuesWithEvents.issueEventTypes',
      foreignField: '_id',
      as: 'expandedissueEventTypes',
    };

    const getIssue = {
      from: 'issues',
      localField: 'expandedIssuesWithEvents.issue',
      foreignField: '_id',
      as: 'expandedIssue',
    };

    const getAssignee = {
      from: 'assignees',
      localField: 'expandedIssue.assignee',
      foreignField: '_id',
      as: 'expandedAssignee',
    };

    const query = this.repoModel
      .aggregate()
      .match({ repo: repoId })
      .project({ issuesWithEvents: 1 })
      .unwind('$issuesWithEvents')
      .lookup(getIssuesWithEvents)
      .unwind('$expandedIssuesWithEvents')
      //   .lookup(getIssueEventTypes)
      //   .unwind('$expandedissueEventTypes')
      .lookup(getIssue)
      .unwind('$expandedIssue')
      .project({ expandedIssue: 1 })
      .lookup(getAssignee)
      .unwind('$expandedAssignee');

    const labels = await query.exec();
    console.log(labels);
  }
}
