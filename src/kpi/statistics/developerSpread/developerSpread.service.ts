import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../../../entities/users/user.service';
import { CommitService } from '../../../entities/commits/commit.service';
import { RepositoryIdentifier } from '../../../entities/repositories/model';
import { RepositoryService } from '../../../entities/repositories/repository.service';
import { Intervals } from './lib';

@Injectable()
export class DeveloperSpreadService {
  private readonly logger = new Logger(DeveloperSpreadService.name);

  constructor(private readonly repoService: RepositoryService) {}

  async developerSpread(
    repo: RepositoryIdentifier,
    interval: Intervals = Intervals.MONTH,
    since: string = '1970-01-01',
  ) {
    const pipeline = this.repoService.preAggregate(
      { owner: repo.owner },
      {
        issues: { events: { actor: true, since: since } },
        commits: { author: true, since: since },
      },
    );
    pipeline.unwind('$commits');
    pipeline.unwind('$issues');
    pipeline.unwind('$issues.events');
    pipeline.group({
      _id: '$owner',
      contributors: {
        $addToSet: '$commits.author',
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
    pipeline.unwind('$activities');
    pipeline.match({
      'activities.user.type': 'User',
    });
    pipeline.redact(
      { $in: ['$activities.user', '$contributors'] },
      '$$KEEP',
      '$$PRUNE',
    );
    pipeline.group({
      _id: {
        login: '$activities.user.login',
        year: { $year: '$activities.timestamp' },
        month:
          interval === Intervals.MONTH
            ? { $month: '$activities.timestamp' }
            : undefined,
        week:
          interval === Intervals.WEEK
            ? { $week: '$activities.timestamp' }
            : undefined,
        day:
          interval === Intervals.DAY
            ? { $dayOfYear: '$activities.timestamp' }
            : undefined,
      },
      repos: { $addToSet: '$activities.repo' },
    });
    pipeline.group({
      _id: {
        year: '$_id.year',
        month: interval === Intervals.MONTH ? '$_id.month' : undefined,
        week: interval === Intervals.WEEK ? '$_id.week' : undefined,
        day: interval === Intervals.DAY ? '$_id.day' : undefined,
      },
      spread: {
        $avg: { $size: '$repos' },
      },
      devs: { $sum: 1 },
    });
    pipeline.project({
      year: '$_id.year',
      month: '$_id.month',
      week: '$_id.week',
      day: '$_id.day',
      spread: '$spread',
      devs: '$devs',
    });
    pipeline.group({
      _id: null,
      data: { $push: '$$ROOT' },
      sum: { $sum: { $multiply: ['$spread', '$devs'] } },
      intervals: { $sum: '$devs' },
    });
    pipeline.project({
      avg: { $divide: ['$sum', '$intervals'] },
      data: '$data',
    });

    const [result] = await pipeline.exec();
    console.log(result);
    const spreads = {};
    for (const spread of result.data) {
      const { year, spread: avg, devs } = spread;
      if (!spreads[year]) {
        spreads[year] = {};
      }
      spreads[year][spread[interval]] = {
        spread: avg,
        devs: devs,
      };
    }
    return { avg: result.avg, data: spreads };
  }
}
// // avg spread per dev
// pipeline.group({
//   _id: '$_id.login',
//   spread: {
//     $avg: { $size: '$repos' },
//   },
//   intervals: {
//     $sum: 1,
//   },
// });
