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
        // issues: { events: { actor: true }, assignees: true },
        commits: { author: true },
      },
    );
    pipeline.unwind('$commits');
    pipeline.addFields({
      'commits.timestamp': {
        $dateFromString: {
          dateString: '$commits.timestamp',
        },
      },
    });
    pipeline.match({
      'commits.timestamp': { $gte: new Date(since) },
      'commits.author.type': 'User',
    });
    pipeline.group({
      _id: {
        login: '$commits.author.login',
        year: { $year: '$commits.timestamp' },
        month:
          interval === Intervals.MONTH
            ? { $month: '$commits.timestamp' }
            : undefined,
        week:
          interval === Intervals.WEEK
            ? { $week: '$commits.timestamp' }
            : undefined,
        day:
          interval === Intervals.DAY
            ? { $dayOfYear: '$commits.timestamp' }
            : undefined,
      },
      repos: { $addToSet: '$repo' },
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
