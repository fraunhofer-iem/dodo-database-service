import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { sum } from 'lodash';
import { CommitService } from '../../../entities/commits/commit.service';
import { CalculationEventPayload } from '../lib';

@Injectable()
export class ChangesPerFileService {
  private readonly logger = new Logger(ChangesPerFileService.name);

  constructor(
    private commitService: CommitService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('kpi.prepared.changesPerFile')
  public async changesPerFile(payload: CalculationEventPayload) {
    const { kpi, since, release } = payload;

    const result: { _id: string; changes: number }[] = await this.commitService
      .preAggregate(
        {
          repo: (release.repo as any)._id,
        },
        {
          files: true,
          since: since,
          to: release.published_at,
        },
      )
      .unwind('$files')
      .group({
        _id: '$files.filename',
        changes: { $sum: 1 },
      })
      .exec();

    const changesPerFile: { [key: string]: number } = Object.fromEntries(
      release.files.map((file) => [file.path, 0]),
    );
    for (const { _id, changes } of result) {
      if (changesPerFile.hasOwnProperty(_id)) {
        changesPerFile[_id] = changes;
      }
    }
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: changesPerFile,
    });
  }

  @OnEvent('kpi.prepared.avgChangesPerFile')
  public async avgChangesPerFile(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { changesPerFile } = data;

    const avgChangesPerFile =
      sum(Object.values(changesPerFile)) / Object.values(changesPerFile).length;
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: avgChangesPerFile,
    });
  }
}
