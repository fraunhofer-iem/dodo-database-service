import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { sum } from 'lodash';
import { CommitService } from '../../../entities/commits/commit.service';
import { CalculationEventPayload } from '../lib';

@Injectable()
export class ActiveCodeService {
  private readonly logger = new Logger(ActiveCodeService.name);

  constructor(
    private commitService: CommitService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('kpi.prepared.numOfFilesChanged')
  async numberOfFilesChanged(payload: CalculationEventPayload) {
    const { kpi, since, release } = payload;

    const result: { _id: string }[] = await this.commitService
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
      })
      .exec();

    const numberOfFilesChanged = sum(
      result.map((file) =>
        release.files.map((repoFile) => repoFile.path).includes(file._id)
          ? 1
          : 0,
      ),
    );
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: numberOfFilesChanged,
    });
  }

  @OnEvent('kpi.prepared.activeCode')
  async activeCode(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { numOfFilesChanged } = data;

    const activeCode = numOfFilesChanged / release.files.length;
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: activeCode,
    });
  }
}
