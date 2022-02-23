import { Injectable, Logger } from '@nestjs/common';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { Intervals } from '../lib';

@Injectable()
export class ReleaseCycle {
  private readonly logger = new Logger(ReleaseCycle.name);

  constructor(private readonly repoService: RepositoryService) {}

  async releaseCycle(
    interval: Intervals = Intervals.MONTH,
    owner: string,
    repo: string = undefined,
    since: string = undefined,
    to: string = undefined,
  ) {
    const pipeline = this.repoService.preAggregate(
      { owner: owner, repo: repo },
      { releases: { since: since, to: to } },
    );
    pipeline.unwind('$releases');
    pipeline.replaceRoot('$releases');
    pipeline.sort({ created_at: 1 });
    pipeline.group({
      _id: null,
      dates: {
        $push: '$created_at',
      },
    });
    pipeline.project({
      cycles: {
        $reduce: {
          input: { $range: [1, { $size: '$dates' }] },
          initialValue: [],
          in: {
            $concatArrays: [
              '$$value',
              [
                [
                  {
                    $dateDiff: {
                      startDate: {
                        $arrayElemAt: ['$dates', { $subtract: ['$$this', 1] }],
                      },
                      endDate: {
                        $arrayElemAt: ['$dates', '$$this'],
                      },
                      unit: 'day',
                    },
                  },
                  { $arrayElemAt: ['$dates', '$$this'] },
                ],
              ],
            ],
          },
        },
      },
    });
    pipeline.unwind('$cycles');
    pipeline.project({
      interval: { $arrayElemAt: ['$cycles', 0] },
      created_at: { $arrayElemAt: ['$cycles', 1] },
    });
    pipeline.group({
      _id: {
        year: { $year: '$created_at' },
        month:
          interval === Intervals.MONTH ? { $month: '$created_at' } : undefined,
        week:
          interval === Intervals.WEEK ? { $week: '$created_at' } : undefined,
        day:
          interval === Intervals.DAY
            ? { $dayOfYear: '$created_at' }
            : undefined,
      },
      intervals: { $push: '$interval' },
    });
    pipeline.addFields({
      avg: {
        $avg: '$intervals',
      },
    });
    pipeline.group({
      _id: null,
      data: { $push: '$$ROOT' },
      sum: { $sum: { $multiply: ['$avg', { $size: '$intervals' }] } },
      intervals: { $sum: { $size: '$intervals' } },
    });
    pipeline.project({
      data: 1,
      avg: { $divide: ['$sum', '$intervals'] },
    });

    const [result] = await pipeline.exec();
    if (!result) {
      this.logger.error(`Could not calculate: no data in selected time frame`);
      // TODO: throw an error to respond with 404?
      return { avg: null, data: {} };
    } else {
      const cycles = {};
      for (const cycle of result.data) {
        const { _id, avg, intervals: releases } = cycle;
        const { year, ...intervals } = _id;
        if (!cycles[year]) {
          cycles[year] = {};
        }
        cycles[year][intervals[interval]] = {
          avg: avg,
          releases: releases.length,
        };
      }
      return { avg: result.avg, data: cycles };
    }
  }
}
