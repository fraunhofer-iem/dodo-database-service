import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, AnyKeys } from 'mongoose';
import {
  Issue,
  IssueEventTypes,
  Language,
  Commit,
} from 'src/github-api/model/PullRequest';
import { RepositoryNameDto } from 'src/github-api/model/Repository';

import { IssueDocument } from './schemas/issue.schema';
import { IssueEventTypesDocument } from './schemas/issueEventTypes.schema';

import { Label, LabelDocument } from './schemas/labels.schema';
import { AssigneeDocument } from './schemas/assignee.schema';
import { AssigneesDocument } from './schemas/assignees.schema';
import { MilestoneDocument } from './schemas/milestone.schema';

import { RepositoryDocument } from './schemas/repository.schema';

import { IssueWithEventsDocument } from './schemas/issueWithEvents.schema';
import { LanguageDocument } from './schemas/language.schema';
import { CommitDocument } from './schemas/commit.schema';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,

    @InjectModel('Issue')
    private readonly issueModel: Model<IssueDocument>,

    @InjectModel('IssueEventTypes')
    private readonly issueEventTypesModel: Model<IssueEventTypesDocument>,
    @InjectModel('Label')
    private readonly labelModel: Model<LabelDocument>,
    @InjectModel('Assignee')
    private readonly assigneeModel: Model<AssigneeDocument>,
    @InjectModel('Assignees')
    private readonly assigneesModel: Model<AssigneesDocument>,
    @InjectModel('Milestone')
    private readonly milestoneModel: Model<MilestoneDocument>,
    @InjectModel('IssueWithEvents')
    private readonly issueWithEventsModel: Model<IssueWithEventsDocument>,
    @InjectModel('Languages')
    private readonly languageModel: Model<LanguageDocument>,
    @InjectModel('Commit')
    private readonly commitModel: Model<CommitDocument>,
  ) {}

  async getRepoByName(owner: string, repo: string): Promise<string> {
    const repoM = await this.repoModel.findOne({ repo: repo, owner }).exec();

    return repoM._id;
  }



  async saveLanguages(
    repoIdent: RepositoryNameDto,
    languages: Language,
  ): Promise<Language> {
    const exists = await this.repoModel.exists({
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    });
    if (exists) {
      const repoM = await this.repoModel
        .findOne({ repo: repoIdent.repo, owner: repoIdent.owner })
        .exec();
      const languageModel = new this.languageModel();
      const entryExists = await this.languageModel.exists({
        repo_id: repoM._id,
      });
      if (entryExists) {
        this.logger.debug(
          `languages entry for ${repoIdent.owner}/${repoIdent.repo} already exists`,
        );
        return languages;
      }
      this.logger.debug(
        `saving programming languages from ${repoIdent.owner}/${repoIdent.repo} to database...`,
      );

      languageModel.repo_id = repoM._id;
      languageModel.languages = languages;
      const savedLanguages = await languageModel.save();

      await this.updateRepo(repoM._id, { languages: savedLanguages });

      this.logger.debug(
        `stored programming languages from ${repoIdent.owner}/${repoIdent.repo} successful`,
      );
    } else {
      //TODO: functionality moved to new module await this.createRepo(repoIdent);
      this.saveLanguages(repoIdent, languages);
    }
    return languages;
  }

  async saveCommit(repoId: string, commit: Commit) {
    this.logger.debug('saving commit to database');
    const commitModel = new this.commitModel();

    this.logger.debug(commit);
    commitModel.url = commit.url;
    commitModel.login = commit.login;
    commitModel.timestamp = commit.timestamp;

    const savedCommit = await commitModel.save();

    await this.updateRepo(repoId, { commits: savedCommit });

    this.logger.debug('saving commit to database finished');

    return savedCommit;
  }

  async updateRepo(repoId: string, push: AnyKeys<RepositoryDocument>) {
    await this.repoModel
      .findByIdAndUpdate(repoId, {
        $push: push,
      })
      .exec();
  }
}
