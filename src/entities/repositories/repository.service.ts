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
      releases?: boolean;
      diffs?: boolean;
    },
  ): Aggregate<any[]> {
    const pipeline = this.repoModel.aggregate().match(repoIdent);
    if (options.issues) {
      pipeline.lookup({
        from: 'issues',
        localField: 'issues',
        foreignField: '_id',
        as: 'issues',
      });
      pipeline.unwind('$issues');
      pipeline.lookup({
        from: 'users',
        localField: 'issues.user',
        foreignField: '_id',
        as: 'issues.user',
      });
      pipeline.lookup({
        from: 'users',
        localField: 'issues.assignee',
        foreignField: '_id',
        as: 'issues.assignee',
      });
      pipeline.addFields({
        'issues.user': {
          $arrayElemAt: ['$issues.user', 0],
        },
        'issues.assignee': {
          $arrayElemAt: ['$issues.assignee', 0],
        },
      });
      if (options.issues.assignees) {
        pipeline.lookup({
          from: 'users',
          localField: 'issues.assignees',
          foreignField: '_id',
          as: 'issues.assignees',
        });
      }
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
        data: { $first: '$$ROOT' },
        issues: {
          $push: '$issues',
        },
      });
      pipeline.addFields({
        'data.issues': '$issues',
      });
      pipeline.replaceRoot('$data');
    } else {
      pipeline.project({ issues: 0 });
    }
    if (options.commits) {
      // commits lookup
      if (options.commits.author) {
        // commit author lookup
      }
    } else {
      pipeline.project({ commits: 0 });
    }
    if (options.releases) {
    } else {
      pipeline.project({ releases: 0 });
    }

    if (options.diffs) {
    } else {
      pipeline.project({ diffs: 0 });
    }
    return pipeline;
  }
}
