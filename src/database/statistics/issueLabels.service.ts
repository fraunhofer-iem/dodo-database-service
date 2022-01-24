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

    const lookupLabels = {
      from: 'labels',
      localField: 'expandedIssue.label',
      foreignField: '_id',
      as: 'expandedLabels',
    };

    const lookupAssignees = {
      from: 'assignees',
      localField: 'expandedIssue.assignees',
      foreignField: '_id',
      as: 'expandedAssignees',
    };

    const query = this.repoModel
      .aggregate()
      .match({ repo: repoId })
      .project({ issuesWithEvents: 1 })
      .unwind('$issuesWithEvents')
      .lookup(getIssuesWithEvents)
      .unwind('$expandedIssuesWithEvents')
      .lookup(getIssue)
      .unwind('$expandedIssue')
      .project({ expandedIssue: 1 })
      .lookup(getAssignee)
      .unwind('$expandedAssignee')
      .lookup(lookupAssignees)
      .unwind('$expandedAssignees')
      .lookup(lookupLabels)
      .unwind('expandedLabels')
      // .project({
      //   name: '$expandedIssue.name',
      //   assignee: '$expandedAssignees.login',
      //   label: '$expandedLabels.name',
      //   creation: '$expandedIssue.created_at',
      //   closing: '$expandedIssue.closed_at',
      // });
      .group({
        _id: '$expandedIssue',
        assignees: { $push: '$expandedAssignees.login' },
        labels: { $addToSet: '$expandedLabels.name' },
      });
    // .unwind('assignees')
    // .unwind('labels');
    // .project({
    //   name: '$_id.title',
    //   assignee: '$assignees',
    //   label: '$labels',
    //   creation: '$_id.created_at',
    //   closing: { $ifNull: ['$_id.closed_at', Date()] },
    //   _id: 0,
    // });

    const labels = await query.exec();
    console.log(labels);
  }
}
