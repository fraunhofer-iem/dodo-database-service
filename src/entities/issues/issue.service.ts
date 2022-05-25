import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model, Aggregate } from 'mongoose';
import { documentExists, retrieveDocument } from '../../lib';
import {
  assigneeLookup,
  assigneesLookup,
  eventsActorLookup,
  eventsLookup,
  labelsLookup,
  repoLookup,
  userLookup,
} from './lib';
import { Issue, IssueDocument } from './model/schemas';
@Injectable()
export class IssueService {
  private readonly logger = new Logger(IssueService.name);

  constructor(
    @InjectModel(Issue.name)
    private readonly issueModel: Model<IssueDocument>,
  ) {}

  public async readOrCreate(json: Issue): Promise<IssueDocument> {
    let issue: IssueDocument;
    try {
      issue = await this.read({ node_id: json.node_id });
    } catch {
      issue = await this.create(json);
    }
    return issue;
  }

  public async read(
    filter: FilterQuery<IssueDocument>,
  ): Promise<IssueDocument> {
    let issue: IssueDocument;
    try {
      issue = await retrieveDocument(this.issueModel, filter);
    } catch (e) {
      throw e;
    }
    return issue;
  }

  public async create(json: AnyKeys<IssueDocument>) {
    if (await documentExists(this.issueModel, { node_id: json.node_id })) {
      throw new Error('Issue does already exist');
    }
    return this.issueModel.create(json);
  }

  public preAggregate(
    filter: FilterQuery<Issue> = undefined,
    options: {
      repo?: boolean;
      labels?: boolean;
      assignees?: boolean;
      events?: {
        actor?: boolean;
        since?: string;
        to?: string;
      };
      since?: Date | string;
      to?: Date | string;
    },
  ): Aggregate<any> {
    const pipeline = this.issueModel.aggregate();
    if (filter) {
      pipeline.match(filter);
    }
    pipeline.lookup(userLookup);
    pipeline.lookup(assigneeLookup);
    pipeline.addFields({
      user: {
        $arrayElemAt: ['$user', 0],
      },
      assignee: {
        $arrayElemAt: ['$assignee', 0],
      },
      created_at: {
        $dateFromString: {
          dateString: '$created_at',
        },
      },
      updated_at: {
        $dateFromString: {
          dateString: '$updated_at',
        },
      },
      closed_at: {
        $dateFromString: {
          dateString: '$closed_at',
        },
      },
    });
    if (options.since) {
      pipeline.match({
        created_at: { $gte: new Date(options.since) },
      });
    }
    if (options.to) {
      pipeline.match({
        created_at: { $lte: new Date(options.to) },
      });
    }
    if (options.assignees) {
      pipeline.lookup(assigneesLookup);
    } else {
      pipeline.project({ assignees: 0 });
    }
    if (options.events) {
      const { since, to } = options.events;
      pipeline.lookup(eventsLookup);
      pipeline.unwind({ path: '$events', preserveNullAndEmptyArrays: true });
      pipeline.addFields({
        'events.created_at': {
          $dateFromString: {
            dateString: '$events.created_at',
          },
        },
      });
      if (since) {
        pipeline.match({
          'events.created_at': {
            $gte: new Date(since),
          },
        });
      }
      if (to) {
        pipeline.match({
          'events.created_at': {
            $lte: new Date(to),
          },
        });
      }
      if (options.events.actor) {
        pipeline.lookup(eventsActorLookup);
        pipeline.addFields({
          'events.actor': {
            $arrayElemAt: ['$events.actor', 0],
          },
        });
      } else {
        pipeline.project({ 'events.actor': 0 });
      }
      pipeline.group({
        _id: '$_id',
        data: { $first: '$$ROOT' },
        events: { $push: '$events' },
      });
      pipeline.addFields({
        'data.events': '$events',
      });
      pipeline.replaceRoot('$data');
    } else {
      pipeline.project({ events: 0 });
    }
    if (options.labels) {
      pipeline.lookup(labelsLookup);
    } else {
      pipeline.project({ labels: 0 });
    }
    if (options.repo) {
      pipeline.lookup(repoLookup);
      pipeline.addFields({
        repo: {
          $arrayElemAt: ['$repo', 0],
        },
      });
    } else {
      pipeline.project({ repo: 0 });
    }
    return pipeline;
  }
}
