import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Aggregate, FilterQuery, Model } from 'mongoose';
import { Repository, RepositoryDocument } from './model/schemas';
import { CreateRepositoryDto, RepositoryIdentifier } from './model';
import { retrieveDocument } from '../../lib';
import { IssueService } from '../issues/issue.service';
import { CommitService } from '../commits/commit.service';
import { ReleaseService } from '../releases/release.service';
import { PullRequestService } from '../pullRequests/pullRequest.service';
import {
  diffsPullrequestfilesLookup,
  issuesLabelsAssigneesLookup,
  releasesLookup,
} from './lib';

@Injectable()
export class RepositoryService {
  private readonly logger = new Logger(RepositoryService.name);

  constructor(
    @InjectModel(Repository.name)
    private readonly repoModel: Model<RepositoryDocument>,
    private issueService: IssueService,
    private commitService: CommitService,
    private releaseService: ReleaseService,
    private pullRequestService: PullRequestService,
  ) {}

  public async initializeRepository(createRepoDto: CreateRepositoryDto) {
    const repo = await this.readOrCreate(createRepoDto);
    await this.issueService.storeIssues(createRepoDto, repo._id);
    await this.commitService.storeCommits(createRepoDto, repo._id);
    await this.releaseService.storeReleases(createRepoDto, repo._id);
    await this.pullRequestService.storePullRequestDiffsForRepo(
      createRepoDto,
      repo._id,
    );
    return repo;
  }

  public async getRepositoryById(id: string) {
    return this.repoModel.findById(id).exec();
  }

  public async read(
    filter: FilterQuery<RepositoryDocument>,
    project?: { [P in keyof RepositoryDocument]?: boolean },
  ): Promise<RepositoryDocument> {
    try {
      return retrieveDocument(this.repoModel, filter, project);
    } catch (e) {
      throw e;
    }
  }

  /**
   * Creates the specified repository if it doesn't exist.
   * If it exists it returns the existing one.
   */
  public async readOrCreate(
    json: CreateRepositoryDto,
  ): Promise<RepositoryDocument> {
    let repo: RepositoryDocument;
    try {
      repo = await this.read({ owner: json.owner, repo: json.repo });
    } catch {
      repo = await this.repoModel.create(json);
    }
    return repo;
  }

  public preAggregate(
    repoIdent: RepositoryIdentifier,
    options: {
      issues?: {
        labels?: boolean;
        assignees?: boolean;
        events?: {
          actor?: boolean;
        };
      };
      releases?;
      diffs?: {
        pullrequestfiles?: boolean;
      };
      commits?: {
        author?: boolean;
      };
    },
  ): Aggregate<any[]> {
    const query = this.repoModel.aggregate().match(repoIdent);
    if (options.issues) {
      if (options.issues.labels && options.issues.assignees) {
        return issuesLabelsAssigneesLookup(query);
      }
      if (options.issues.events) {
        // event lookup
        if (options.issues.events.actor) {
          // actor lookup
        }
      }
      if (options.issues.labels) {
        // label lookup
      }
    }
    if (options.releases) {
      return releasesLookup(query);
    }
    if (options.diffs) {
      // diffs lookup
      if (options.diffs.pullrequestfiles) {
        return diffsPullrequestfilesLookup(query);
      }
    }
    if (options.commits) {
      // commits lookup
      if (options.commits.author) {
        // commit author lookup
      }
    }
  }
}
