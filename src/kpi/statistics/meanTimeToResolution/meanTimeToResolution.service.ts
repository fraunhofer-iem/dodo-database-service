import { Injectable, Logger } from '@nestjs/common';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { RepositoryIdentifier } from 'src/entities/repositories/model';
import { Aggregate } from 'mongoose';
import { groupByIntervalSelector, Intervals, serialize } from '../lib';

@Injectable()
export class MeanTimeToResolutionService {
  private readonly logger = new Logger(MeanTimeToResolutionService.name);

  constructor(private readonly repoService: RepositoryService) {}

  async meanTimeToResolution(
    repoIdent: RepositoryIdentifier,
    interval: Intervals = Intervals.MONTH,
    labels: string[] = [], // calculate only for tickets with at least on of these labels
    since: string = undefined,
    to: string = undefined,
  ) {
    const pipeline: Aggregate<
      {
        avg: number; // mean time to resolution (in seconds) for all tickets selected using labels parameter
        data: {
          // development of mean time to resolution over time
          _id: {
            // granularity information as defined by the interval parameter
            year: number | undefined;
            month: number | undefined;
            week: number | undefined;
            day: number | undefined;
          };
          avg: number; // mean time to resolution (in seconds) for current interval
          data: any[]; // time to resolution (in seconds) of tickets that have been closed in this interval
        }[];
      }[]
    > = this.repoService.preAggregate(repoIdent, {
      issues: { labels: true, since: since, to: to },
    });
    pipeline.unwind('issues');
    pipeline.replaceRoot('$issues');
    pipeline.match({
      labels: { $not: { $size: 0 } },
    });
    pipeline.unwind('labels');
    if (labels.length) {
      pipeline.match({
        'labels.name': {
          $in: labels,
        },
        state: 'closed',
      });
    }
    pipeline.addFields({
      timeToResolution: {
        $dateDiff: {
          startDate: '$created_at',
          endDate: '$closed_at',
          unit: 'second',
        },
      },
    });
    pipeline.group({
      _id: groupByIntervalSelector('$closed_at', interval),
      data: { $push: '$timeToResolution' },
    });
    pipeline.addFields({
      avg: { $avg: '$data' },
    });
    pipeline.group({
      _id: null,
      sum: { $sum: { $multiply: ['$avg', { $size: '$data' }] } },
      tickets: { $sum: { $size: '$data' } },
      data: { $push: '$$ROOT' },
    });
    pipeline.project({
      avg: { $divide: ['$sum', '$tickets'] },
      data: 1,
    });

    const [result] = await pipeline.exec();
    try {
      return serialize(result, interval, 'resolutionTimes');
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }
}
