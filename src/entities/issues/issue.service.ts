import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { updateArray } from '../../lib';
import { RepositoryIdentifier } from '../repositories/model';
import { Repository, RepositoryDocument } from '../repositories/model/schemas';
import { getIssueEvents, issueQuerier } from './lib';
import { Issue, IssueDocument } from './model/schemas';

@Injectable()
export class IssueService {
  private readonly logger = new Logger(IssueService.name);

  constructor(
    @InjectModel(Repository.name)
    private readonly repoModel: Model<RepositoryDocument>,
    @InjectModel(Issue.name)
    private readonly issueModel: Model<IssueDocument>,
  ) {}

  public async storeIssues(repoIdent: RepositoryIdentifier, repoId: string) {
    for await (const issue of issueQuerier(repoIdent)) {
      this.logger.log(`Storing issue ${issue.number}`);
      issue.events = await getIssueEvents(repoIdent, issue.number);
      const issueDocument = await this.issueModel.create(issue);
      await updateArray(this.repoModel, repoId, { issues: issueDocument });
    }
  }
}
