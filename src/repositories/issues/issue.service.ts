import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { OCTOKIT } from 'src/lib/OctokitHelper';
import { RepositoryIdentifier } from '../model';
import { RepositoryDocument } from '../model/schemas';
import {
  RepositoryFileDocument,
  PullRequestFileDocument,
  PullRequestDocument,
  DiffDocument,
} from '../pullRequests/model/schemas';
import { getIssues } from './lib';

@Injectable()
export class IssueService {
  private readonly logger = new Logger(IssueService.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
    @InjectModel('RepositoryFiles')
    private readonly repoFileModel: Model<RepositoryFileDocument>,
    @InjectModel('PullRequestFiles')
    private readonly pullFileModel: Model<PullRequestFileDocument>,
    @InjectModel('PullRequest')
    private readonly pullRequestModel: Model<PullRequestDocument>,
    @InjectModel('Diff')
    private readonly diffModel: Model<DiffDocument>,
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
      // first store issue
      const issueId = await saveIssue(
        issue as any, // TODO: workaround because the current label handling seems to be very broken and we ignore it for now
        repoId,
      );
      // then query the event types and store them
      await this.getAndStoreIssueEventTypes(
        repoIdent,
        issue.number,
        pageNumber,
        issueId,
      );
    }

    if (issues.length == 100) {
      this.processIssues(repoIdent, repoId, pageNumber + 1);
    }
  }

}
