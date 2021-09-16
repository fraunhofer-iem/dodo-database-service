import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Diff, Issue, IssueEventTypes, Releases, IssueWithEvents } from 'src/github-api/model/PullRequest';
import { RepositoryNameDto } from 'src/github-api/model/Repository';
import { DiffDocument } from './schemas/diff.schema';
import { IssueDocument } from './schemas/issue.schema';
import { IssueEventTypesDocument } from './schemas/issueEventTypes.schema';
import { ReleasesDocument } from './schemas/releases.schema';
import { LabelDocument } from './schemas/labels.schema';
import { AssigneeDocument } from './schemas/assignee.schema';
import { AssigneesDocument } from './schemas/assignees.schema';
import { MilestoneDocument } from './schemas/milestone.schema';
import { Pull_requestDocument } from './schemas/pull_request.schema';
import { PullRequestDocument } from './schemas/pullRequest.schema';
import { PullRequestFileDocument } from './schemas/pullRequestFile.schema';
import { RepositoryDocument } from './schemas/repository.schema';
import { RepositoryFileDocument } from './schemas/repositoryFile.schema';
import { IssueWithEventsDocument } from './schemas/issueWithEvents.schema';

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
    @InjectModel('Pull_request')
    private readonly pull_requestModel: Model<Pull_requestDocument>,
    @InjectModel('IssueWithEvents')
    private readonly issueWithEventsModel: Model<IssueWithEventsDocument>,
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
        diffs: [],
      //  releases : [],
      }).save();

      this.logger.debug('Instance created ' + repoInstance);
      return repoInstance._id;
    }
  }

  async getRepoByName(owner: string, repo: string,): Promise<string> {
    const repoM = await this.repoModel.findOne({ repo: repo, owner }).exec();

    return repoM._id;
  }

  async saveIssues(issues: Issue, repoId: string) {
    this.logger.debug('saving issues to database');
    const issueModel = new this.issueModel();

      this.logger.debug(issues);
      issueModel.id = issues.id;
      issueModel.state = issues.state;
      issueModel.node_id = issues.node_id;
      const labelss = await this.labelModel.create(issues.labels,);
      issueModel.label = labelss;

      const assigneee = await this.assigneeModel.create(issues.assignee,);
      issueModel.assignee = assigneee;

      const assigneees = await this.assigneesModel.create(issues.assignees,);
      issueModel.assignees = assigneees;

      const milestonee = await this.milestoneModel.create(issues.milestone,);
      issueModel.milestone = milestonee;

      const pull_requestt = await this.pull_requestModel.create(issues.pull_request,);
      issueModel.pull_request = pull_requestt;

      issueModel.created_at = issues.created_at;
      issueModel.updated_at = issues.updated_at;
      issueModel.closed_at = issues.closed_at;
      issueModel.title = issues.title;
      const issueModels = await issueModel.save();


      await this.repoModel
        .findByIdAndUpdate(repoId, {
          $push: { issues: [issueModels] },
        })
        .exec();
      return issueModel.save();
  }

  /**
   * Function for to save issueEventTypes
   * @param issuesEventTypes 
   * @param repoId 
   * @returns 
    */
  async saveIssuesEventTypes(issuesEventTypes: IssueEventTypes, repoId: string) {
    this.logger.debug('saving issues event types to database');
    const issueEventTypesModel = new this.issueEventTypesModel();

      this.logger.debug(issuesEventTypes);
      issueEventTypesModel.id = issuesEventTypes.id;
      issueEventTypesModel.node_id = issuesEventTypes.node_id;
    
      const assigneee = await this.assigneeModel.create(issuesEventTypes.assignee,);
      issueEventTypesModel.assignee = assigneee;

      issueEventTypesModel.created_at = issuesEventTypes.created_at;
      issueEventTypesModel.commit_url = issuesEventTypes.commit_url;
      issueEventTypesModel.url = issuesEventTypes.url;
      issueEventTypesModel.event = issuesEventTypes.event;
      const issueEventTypesModels = await issueEventTypesModel.save();

      await this.repoModel
        .findByIdAndUpdate(repoId, {
          $push: { issuesEventTypes: [issueEventTypesModels] },
        })
        .exec();
      return issueEventTypesModel.save();
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

      await this.repoModel
        .findByIdAndUpdate(repoId, {
          $push: { releases: [releasesModels] },
        })
        .exec();
      
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
    await this.repoModel
      .findByIdAndUpdate(repoId, {
        $push: { diffs: [savedDiff] },
      })
      .exec();
    this.logger.debug('saving diff to database finished');
  }

  async saveIssuesWithEvents(issuesWithEvents: IssueWithEvents, repoId: string) {
    const issueWithEventsModel = new this.issueWithEventsModel();
      const issuee = await this.issueModel.create(
        issuesWithEvents.issue,
      );

      const issueeEventTypes = await this.issueEventTypesModel.create(
        issuesWithEvents.issueEventTypes,
      );

      issueWithEventsModel.issue = issuee;
      issueWithEventsModel.issueEventTypes = issueeEventTypes;
      const savedIssueWithEvents = await issueWithEventsModel.save();
      await this.issueWithEventsModel
      .findByIdAndUpdate(repoId, {
        $push: { issuesWithEvents: [savedIssueWithEvents] },
      })
      .exec();
    this.logger.debug('saving issueWithEvents to database finished');
  }
}
