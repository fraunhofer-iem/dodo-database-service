import { Injectable, Logger } from '@nestjs/common';
import { RepositoryService } from '../../../entities/repositories/repository.service';
import {
  Intervals,
  groupByIntervalSelector,
  serialize,
} from '../../statistics/lib';

@Injectable()
export class DeveloperSpreadService {
  private readonly logger = new Logger(DeveloperSpreadService.name);

  constructor(private readonly repoService: RepositoryService) {}

  async developerSpread(
    interval: Intervals = Intervals.MONTH,
    owner: string,
    repo: string = undefined,
    since: string = undefined,
    to: string = undefined,
  ) {
    const pipeline = this.repoService.preAggregate(
      { owner: owner },
      {
        issues: { events: { actor: true, since: since, to: to } },
        commits: { author: true, since: since, to: to },
      },
    );
    pipeline.unwind('$commits');
    pipeline.group({
      _id: '$_id',
      contributors: {
        $addToSet: '$commits.author',
      },
      owner: { $first: '$owner' },
      repo: { $first: '$repo' },
      commits: { $push: '$commits' },
      issues: { $first: '$issues' },
    });
    if (repo) {
      pipeline.addFields({
        contributors: {
          $cond: {
            if: { $eq: ['$repo', repo] },
            then: '$contributors',
            else: null,
          },
        },
      });
    }
    pipeline.unwind('$commits');
    pipeline.unwind('$issues');
    pipeline.unwind('$issues.events');
    pipeline.group({
      _id: '$owner',
      contributors: {
        $addToSet: '$contributors',
      },
      commits: {
        $addToSet: {
          user: '$commits.author',
          timestamp: '$commits.timestamp',
          repo: '$repo',
        },
      },
      events: {
        $addToSet: {
          user: '$issues.events.actor',
          timestamp: '$issues.events.created_at',
          repo: '$repo',
        },
      },
    });
    pipeline.project({
      activities: {
        $setUnion: ['$commits', '$events'],
      },
      contributors: 1,
    });
    // without a repo filter, contributors looks like:
    //    [ [<contributors of repo 1>], [<contributors of repo 2>], [<contributors of repo 3>]]
    // with a repo filter, contributors looks like:
    //    [ [], [<contributors of filtered repo>]]
    // I couldn't find a more elegant way to flatten this array than this combination of unwind-unwind-group
    pipeline.unwind('$contributors');
    pipeline.unwind('$contributors');
    pipeline.group({
      _id: '_id',
      contributors: {
        $addToSet: '$contributors',
      },
      activities: {
        $first: '$activities',
      },
    });
    pipeline.unwind('$activities');
    pipeline.match({
      'activities.user.type': 'User', // filter Bots
    });
    pipeline.redact(
      // if
      { $in: ['$activities.user', '$contributors'] },
      // then
      '$$KEEP',
      // else
      '$$PRUNE',
    );
    pipeline.group({
      _id: {
        login: '$activities.user.login',
        ...groupByIntervalSelector('$activities.timestamp', interval),
      },
      timestamp: { $last: '$activities.timestamp' },
      repos: { $addToSet: '$activities.repo' },
    });
    pipeline.group({
      _id: groupByIntervalSelector('$timestamp', interval),
      avg: {
        $avg: { $size: '$repos' },
      },
      data: { $sum: 1 },
    });
    pipeline.group({
      _id: null,
      data: { $push: '$$ROOT' },
      sum: { $sum: { $multiply: ['$avg', '$data'] } }, // weighted average spread
      intervals: { $sum: '$data' },
    });
    pipeline.project({
      avg: { $divide: ['$sum', '$intervals'] }, // total weighted average spread
      data: '$data',
    });

    const [result] = await pipeline.exec();
    try {
      return serialize(result, interval, 'numberOfDevs');
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }
}
