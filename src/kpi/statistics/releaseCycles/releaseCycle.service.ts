import { Injectable, Logger } from '@nestjs/common';
import { Aggregate } from 'mongoose';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { groupByIntervalSelector, Intervals, serialize } from '../lib';

@Injectable()
export class ReleaseCycleService {
  private readonly logger = new Logger(ReleaseCycleService.name);

  constructor(private readonly repoService: RepositoryService) {}

  async releaseCycle(
    interval: Intervals = Intervals.MONTH,
    owner: string,
    repo: string = undefined,
    since: string = undefined,
    to: string = undefined,
  ) {
    const pipeline: Aggregate<
      {
        avg: number; // average release cycle (in days)
        data: {
          // development of release cycle over time
          _id: {
            // granularity information as defined by the interval parameter
            year: number | undefined;
            month: number | undefined;
            week: number | undefined;
            day: number | undefined;
          };
          avg: number; // release cycle (in days) for current interval
          data: any; // number of releases that were created in this interval
        }[];
      }[]
    > = this.repoService.preAggregate(
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
      _id: groupByIntervalSelector('$created_at', interval),
      intervals: { $push: '$interval' },
    });
    pipeline.addFields({
      avg: {
        $avg: '$intervals',
      },
      data: {
        $size: '$intervals',
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
    try {
      return serialize(result, interval, 'numberOfReleases');
    } catch (err) {
      this.logger.error(err);
    }
  }
}
