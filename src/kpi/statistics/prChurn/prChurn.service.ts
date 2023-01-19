import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { sumBy } from 'lodash';
import { DiffFile } from 'src/entities/diffFiles/model/schemas';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { CalculationEventPayload } from '../lib';

@Injectable()
export class PrChurnService {
  private readonly logger = new Logger(PrChurnService.name);

  constructor(
    private repoService: RepositoryService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('kpi.prepared.prChurn')
  public async prChurn(payload: CalculationEventPayload) {
    const { kpi, since, release } = payload;

    const diffs = await this.repoService
      .preAggregate(
        { _id: (release.repo as any)._id },
        {
          diffs: {
            pullRequest: {
              since: since ? since.toUTCString() : undefined,
              to: release.published_at,
            },
            diffFiles: true,
          },
        },
      )
      .unwind('$diffs')
      .replaceRoot('$diffs')
      .allowDiskUse(true)
      .exec();

    const prChurn: { [key: string]: number } = Object.fromEntries(
      diffs.map((diff) => {
        return [
          diff.pullRequest.url,
          sumBy(diff.files, (file: DiffFile) => file.changes),
        ];
      }),
    );
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: prChurn,
    });
  }

  @OnEvent('kpi.prepared.prChurnRatio')
  public async prChurnRatio(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { prChurn, totalLoc } = data;

    if (typeof prChurn === 'undefined') {
      this.eventEmitter.emit('kpi.calculated', {
        kpi,
        release,
        since,
        value: {},
      });
    } else {
      const prChurnRatio = Object.fromEntries(
        Object.entries(prChurn).map((entry) => [
          entry[0],
          +entry[1] / totalLoc,
        ]),
      );
      this.eventEmitter.emit('kpi.calculated', {
        kpi,
        release,
        since,
        value: prChurnRatio,
      });
    }
  }
}
