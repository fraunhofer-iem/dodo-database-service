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
  commitsAuthorLookup,
  commitsLookup,
  diffsLookup,
  issuesAssigneeLookup,
  issuesAssigneesLookup,
  issuesEventsActorLookup,
  issuesEventsLookup,
  issuesLabelsLookup,
  issuesLookup,
  issuesUserLookup,
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
    filter: FilterQuery<RepositoryDocument>,
    options: {
      issues?: {
        labels?: boolean;
        assignees?: boolean;
        events?: {
          actor?: boolean;
          since?: string;
        };
        since?: string;
      };
      commits?: {
        author?: boolean;
        since?: string;
      };
      releases?: boolean;
      diffs?: boolean;
    },
  ): Aggregate<any[]> {
    const pipeline = this.repoModel.aggregate().match(filter);
    if (options.issues) {
      pipeline.lookup(issuesLookup);
      pipeline.unwind('$issues');
      pipeline.lookup(issuesUserLookup);
      pipeline.lookup(issuesAssigneeLookup);
      pipeline.addFields({
        'issues.user': {
          $arrayElemAt: ['$issues.user', 0],
        },
        'issues.assignee': {
          $arrayElemAt: ['$issues.assignee', 0],
        },
        'issues.created_at': {
          $dateFromString: {
            dateString: '$issues.created_at',
          },
        },
      });
      if (options.issues.since) {
        pipeline.match({
          'issues.created_at': { $gte: new Date(options.issues.since) },
        });
      }
      if (options.issues.assignees) {
        pipeline.lookup(issuesAssigneesLookup);
      }
      if (options.issues.events) {
        pipeline.lookup(issuesEventsLookup);
        if (options.issues.events.actor) {
          pipeline.unwind('$issues.events');
          pipeline.lookup(issuesEventsActorLookup);
          pipeline.addFields({
            'issues.events.actor': {
              $arrayElemAt: ['$issues.events.actor', 0],
            },
            'issues.events.created_at': {
              $dateFromString: {
                dateString: '$issues.events.created_at',
              },
            },
          });
          if (options.issues.events.since) {
            pipeline.match({
              'issues.events.created_at': {
                $gte: new Date(options.issues.events.since),
              },
            });
          }
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
        pipeline.lookup(issuesLabelsLookup);
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
      pipeline.lookup(commitsLookup);
      if (options.commits.author) {
        pipeline.unwind('$commits');
        pipeline.lookup(commitsAuthorLookup);
        pipeline.addFields({
          'commits.author': {
            $arrayElemAt: ['$commits.author', 0],
          },
          'commits.timestamp': {
            $dateFromString: {
              dateString: '$commits.timestamp',
            },
          },
        });
        if (options.commits.since) {
          pipeline.match({
            'commits.timestamp': { $gte: new Date(options.commits.since) },
          });
        }
        pipeline.group({
          _id: '$_id',
          data: { $first: '$$ROOT' },
          commits: {
            $push: '$commits',
          },
        });
        pipeline.addFields({
          'data.commits': '$commits',
        });
        pipeline.replaceRoot('$data');
      }
    } else {
      pipeline.project({ commits: 0 });
    }
    if (options.releases) {
      pipeline.lookup(releasesLookup);
    } else {
      pipeline.project({ releases: 0 });
    }
    if (options.diffs) {
      pipeline.lookup(diffsLookup);
      //TODO: Add options to populate repositoryFiles, prFiles and PR props
    } else {
      pipeline.project({ diffs: 0 });
    }
    return pipeline;
  }
}
