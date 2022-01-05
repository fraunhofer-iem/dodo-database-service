import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Mongoose, OnlyFieldsOfType } from 'mongoose';
import {
  Diff,
  Releases,
  Issue,
  IssueEventTypes,
  Language,
  Commit,
} from 'src/github-api/model/PullRequest';
import { RepositoryNameDto } from 'src/github-api/model/Repository';
import { DiffDocument } from './schemas/diff.schema';
import { IssueDocument } from './schemas/issue.schema';
import { IssueEventTypesDocument } from './schemas/issueEventTypes.schema';
import { ReleasesDocument } from './schemas/releases.schema';
import { LabelDocument } from './schemas/labels.schema';
import { AssigneeDocument } from './schemas/assignee.schema';
import { AssigneesDocument } from './schemas/assignees.schema';
import { MilestoneDocument } from './schemas/milestone.schema';
import { PullRequestDocument } from './schemas/pullRequest.schema';
import { PullRequestFileDocument } from './schemas/pullRequestFile.schema';
import { RepositoryDocument } from './schemas/repository.schema';
import { RepositoryFileDocument } from './schemas/repositoryFile.schema';
import { IssueWithEventsDocument } from './schemas/issueWithEvents.schema';
import { LanguageDocument } from './schemas/language.schema';
import { CommitDocument } from './schemas/commit.schema';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

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
    @InjectModel('Issue')
    private readonly issueModel: Model<IssueDocument>,
    @InjectModel('Releases')
    private readonly releasesModel: Model<ReleasesDocument>,
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

  /**
   * Creates the specified repository if it doesn't exist.
   * If it exists it returns the id of the existing one.
   * @param repo
   * @param owner
   * @returns id
   */
  async createRepo(repoIdent: RepositoryNameDto): Promise<string> {
    const exists = await this.repoModel.exists({
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    });

    if (exists) {
      const repoM = await this.repoModel
        .findOne({ repo: repoIdent.repo, owner: repoIdent.owner })
        .exec();

      this.logger.debug('Model already exists ' + repoM);
      return repoM._id;
    } else {
      this.logger.debug(
        `Creating new model for ${repoIdent.repo} with owner ${repoIdent.owner}`,
      );
      const repoInstance = await new this.repoModel({
        owner: repoIdent.owner,
        repo: repoIdent.repo,
      }).save();

      this.logger.debug('Instance created ' + repoInstance);
      return repoInstance._id;
    }
  }

  async getRepoByName(owner: string, repo: string): Promise<string> {
    const repoM = await this.repoModel.findOne({ repo: repo, owner }).exec();

    return repoM._id;
  }

  /**
   * function to save releases
   * @param releases
   * @param repoId
   * @returns
   */
  async saveReleases(releases: Releases, repoId: string) {
    this.logger.debug('saving Releases to database');
    const releasesModel = new this.releasesModel();

    this.logger.debug(releases);
    releasesModel.url = releases.url;
    releasesModel.id = releases.id;
    releasesModel.node_id = releases.node_id;
    releasesModel.name = releases.name;
    releasesModel.created_at = releases.created_at;
    releasesModel.published_at = releases.published_at;

    const releasesModels = await releasesModel.save();

    await this.updateRepo(repoId, { releases: [releasesModels] });

    this.logger.debug('saving releases to database finished');

    return releasesModel.save();
  }

  async savePullRequestDiff(repoId: string, pullRequestDiff: Diff) {
    this.logger.debug('saving diff to database');
    const createdDiff = new this.diffModel();

    const pullRequest = await new this.pullRequestModel(
      pullRequestDiff.pullRequest,
    ).save();

    const changedFiles = await this.pullFileModel.create(
      pullRequestDiff.changedFiles,
    );

    const repoFiles = await this.repoFileModel.create(
      pullRequestDiff.repoFiles,
    );
    createdDiff.pullRequestFiles = changedFiles;

    createdDiff.repositoryFiles = repoFiles;
    createdDiff.pullRequest = pullRequest;
    const savedDiff = await createdDiff.save();

    await this.updateRepo(repoId, { diffs: [savedDiff] });

    this.logger.debug('saving diff to database finished');
  }

  async saveIssue(issue: Issue, repoId: string) {
    this.logger.debug('saving Issues along with its events to database');
    //instantiating for issue

    const issueModel = new this.issueModel();
    this.logger.debug(issue);
    issueModel.id = issue.id;
    issueModel.number = issue.number;

    issueModel.state = issue.state;
    issueModel.node_id = issue.node_id;
    const labelss = await this.labelModel.create(issue.labels);
    issueModel.label = labelss;

    const assigneee = await this.assigneeModel.create(issue.assignee);
    issueModel.assignee = assigneee;

    const assigneees = await this.assigneesModel.create(issue.assignees);
    issueModel.assignees = assigneees;

    const milestonee = await this.milestoneModel.create(issue.milestone);
    issueModel.milestone = milestonee;

    issueModel.created_at = issue.created_at;
    issueModel.updated_at = issue.updated_at;
    issueModel.closed_at = issue.closed_at;
    issueModel.title = issue.title;
    const issueModels = await issueModel.save();

    const issueWithEventsModel = new this.issueWithEventsModel();
    issueWithEventsModel.issue = issueModels;

    issueWithEventsModel.issueEventTypes = [];
    const savedIssueWithEvents = await issueWithEventsModel.save();
    await this.updateRepo(repoId, { issuesWithEvents: [savedIssueWithEvents] });

    this.logger.debug('saving issueWithEvents to database finished');
    return savedIssueWithEvents.id;
  }

  async saveIssueEvent(events: IssueEventTypes[], issueId: string) {
    const issueEvents = await this.issueEventTypesModel.create(events);

    await this.issueWithEventsModel
      .findByIdAndUpdate(issueId, {
        $push: { issueEventTypes: issueEvents },
      })
      .exec();
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
      await this.createRepo(repoIdent);
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

  async repoExists(repoIdent: RepositoryNameDto): Promise<boolean> {
    return this.repoModel.exists({
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    });
  }

  async updateRepo(repoId: string, push: OnlyFieldsOfType<RepositoryDocument>) {
    await this.repoModel
      .findByIdAndUpdate(repoId, {
        $push: push,
      })
      .exec();
  }
}
