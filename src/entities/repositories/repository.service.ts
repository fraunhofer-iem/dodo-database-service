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
import { Issue } from '../issues/model/schemas';

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
      commits?: {
        author?: boolean;
      };
    },
  ): Aggregate<any[]> {
    const pipeline = this.repoModel
      .aggregate()
      .match(repoIdent)
      .project({ releases: 0, diffs: 0, commits: 0 });
    if (options.issues) {
      pipeline.lookup({
        from: 'issues',
        localField: 'issues',
        foreignField: '_id',
        as: 'issues',
      });
      pipeline.unwind('$issues');
      if (options.issues.events) {
        pipeline.lookup({
          from: 'issueevents',
          localField: 'issues.events',
          foreignField: '_id',
          as: 'issues.events',
        });
        if (options.issues.events.actor) {
          pipeline.unwind('$issues.events');
          pipeline.lookup({
            from: 'users',
            localField: 'issues.events.actor',
            foreignField: '_id',
            as: 'issues.events.actor',
          });
          pipeline.addFields({
            'issues.events.actor': {
              $arrayElemAt: ['$issues.events.actor', 0],
            },
          });
          pipeline.group({
            _id: '$issues._id',
            data: { $first: '$$ROOT' },
            events: { $push: '$issues.events' },
          });
          pipeline.addFields({
            'data.issues.events': '$events',
          });
          pipeline.replaceRoot('$data');
        }
      }
      if (options.issues.labels) {
        pipeline.lookup({
          from: 'labels',
          localField: 'issues.labels',
          foreignField: '_id',
          as: 'issues.labels',
        });
      }
      pipeline.group({
        _id: '$_id',
        issues: {
          $push: '$issues',
        },
      });
    }
    if (options.commits) {
      // commits lookup
      if (options.commits.author) {
        // commit author lookup
      }
    }
    return pipeline;
  }
}
