import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Aggregate, FilterQuery, Model } from 'mongoose';
import { Repository, RepositoryDocument } from './model/schemas';
import { CreateRepositoryDto } from './model';
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
  diffsPullRequestLookup,
  diffsPullRequestFilesLookup,
  diffsRepositoryFilesLookup,
} from './lib';
import { DiffService } from '../diffs/diff.service';

@Injectable()
export class RepositoryService {
  private readonly logger = new Logger(RepositoryService.name);

  constructor(
    @InjectModel(Repository.name)
    private readonly repoModel: Model<RepositoryDocument>,
    private issueService: IssueService,
    private commitService: CommitService,
    private releaseService: ReleaseService,
    private diffService: DiffService,
  ) {}

  public async initializeRepository(createRepoDto: CreateRepositoryDto) {
    const repo = await this.readOrCreate(createRepoDto);
    await this.issueService.storeIssues(createRepoDto, repo._id);
    await this.commitService.storeCommits(createRepoDto, repo._id);
    await this.releaseService.storeReleases(createRepoDto, repo._id);
    await this.diffService.storeDiffs(createRepoDto, repo._id);
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
          to?: string;
        };
        since?: string;
        to?: string;
      };
      commits?: {
        author?: boolean;
        since?: string;
        to?: string;
      };
      releases?: {
        since?: string;
        to?: string;
      };
      diffs?: {
        pullRequestFiles?: boolean;
        repositoryFiles?: boolean;
        pullRequest?: {
          since?: string;
          to?: string;
        };
      };
    },
  ): Aggregate<any[]> {
    const pipeline = this.repoModel.aggregate().match(filter);
    if (options.issues) {
      const { since, to } = options.issues;
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
        'issues.updated_at': {
          $dateFromString: {
            dateString: '$issues.updated_at',
          },
        },
        'issues.closed_at': {
          $dateFromString: {
            dateString: '$issues.updated_at',
          },
        },
      });
      if (since) {
        pipeline.match({
          'issues.created_at': { $gte: new Date(since) },
        });
      }
      if (to) {
        pipeline.match({
          'issues.created_at': { $lte: new Date(to) },
        });
      }
      if (options.issues.assignees) {
        pipeline.lookup(issuesAssigneesLookup);
      }
      if (options.issues.events) {
        const { since, to } = options.issues.events;
        pipeline.lookup(issuesEventsLookup);
        pipeline.unwind('$issues.events');
        pipeline.addFields({
          'issues.events.created_at': {
            $dateFromString: {
              dateString: '$issues.events.created_at',
            },
          },
        });
        if (since) {
          pipeline.match({
            'issues.events.created_at': {
              $gte: new Date(since),
            },
          });
        }
        if (to) {
          pipeline.match({
            'issues.events.created_at': {
              $lte: new Date(to),
            },
          });
        }
        if (options.issues.events.actor) {
          pipeline.lookup(issuesEventsActorLookup);
          pipeline.addFields({
            'issues.events.actor': {
              $arrayElemAt: ['$issues.events.actor', 0],
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
      const { since, to } = options.commits;
      pipeline.lookup(commitsLookup);
      pipeline.unwind('$commits');
      pipeline.addFields({
        'commits.timestamp': {
          $dateFromString: {
            dateString: '$commits.timestamp',
          },
        },
      });
      if (since) {
        pipeline.match({
          'commits.timestamp': {
            $gte: new Date(since),
          },
        });
      }
      if (to) {
        pipeline.match({
          'commits.timestamp': {
            $lte: new Date(to),
          },
        });
      }
      if (options.commits.author) {
        pipeline.lookup(commitsAuthorLookup);
        pipeline.addFields({
          'commits.author': {
            $arrayElemAt: ['$commits.author', 0],
          },
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
    } else {
      pipeline.project({ commits: 0 });
    }
    if (options.releases) {
      const { since, to } = options.releases;
      pipeline.lookup(releasesLookup);
      pipeline.unwind('$releases');
      pipeline.addFields({
        'releases.created_at': {
          $dateFromString: {
            dateString: '$releases.created_at',
          },
        },
        'releases.published_at': {
          $dateFromString: {
            dateString: '$releases.published_at',
          },
        },
      });
      if (since) {
        pipeline.match({
          'releases.created_at': {
            $gte: new Date(since),
          },
        });
      }
      if (to) {
        pipeline.match({
          'releases.created_at': {
            $lte: new Date(to),
          },
        });
      }
      pipeline.group({
        _id: '$_id',
        data: { $first: '$$ROOT' },
        releases: {
          $push: '$releases',
        },
      });
      pipeline.addFields({
        'data.releases': '$releases',
      });
      pipeline.replaceRoot('$data');
    } else {
      pipeline.project({ releases: 0 });
    }
    if (options.diffs) {
      pipeline.lookup(diffsLookup);
      pipeline.unwind('$diffs');
      if (options.diffs.pullRequest) {
        const { since, to } = options.diffs.pullRequest;
        pipeline.lookup(diffsPullRequestLookup);
        pipeline.addFields({
          'diffs.pullRequest': { $arrayElemAt: ['$diffs.pullRequest', 0] },
        });
        pipeline.addFields({
          'diffs.pullRequest.created_at': {
            $dateFromString: {
              dateString: '$diffs.pullRequest.created_at',
            },
          },
          'diffs.pullRequest.updated_at': {
            $dateFromString: {
              dateString: '$diffs.pullRequest.updated_at',
            },
          },
          'diffs.pullRequest.closed_at': {
            $dateFromString: {
              dateString: '$diffs.pullRequest.closed_at',
            },
          },
          'diffs.pullRequest.merged_at': {
            $dateFromString: {
              dateString: '$diffs.pullRequest.merged_at',
            },
          },
        });
        if (since) {
          pipeline.match({
            'diffs.pullRequest.created_at': {
              $gte: new Date(since),
            },
          });
        }
        if (to) {
          pipeline.match({
            'diffs.pullRequest.created_at': {
              $lte: new Date(to),
            },
          });
        }
      }
      if (options.diffs.pullRequestFiles) {
        pipeline.lookup(diffsPullRequestFilesLookup);
      }
      if (options.diffs.repositoryFiles) {
        pipeline.lookup(diffsRepositoryFilesLookup);
      }
      pipeline.group({
        _id: '$_id',
        data: { $first: '$$ROOT' },
        diffs: {
          $push: '$diffs',
        },
      });
      pipeline.addFields({
        'data.diffs': '$diffs',
      });
      pipeline.replaceRoot('$data');
    } else {
      pipeline.project({ diffs: 0 });
    }
    return pipeline;
  }
}
