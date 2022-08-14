import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Commit } from 'src/entities/commits/model/schemas';
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

    const commits: Commit[] = await this.commitService
      .preAggregate(
        {
          _id: { $in: release.commits },
        },
        {
          files: true,
        },
      )
      .exec();

    const releaseFiles = release.files.map((file) => file.path);
    const changedFiles: string[] = [];
    for (const commit of commits) {
      for (const file of commit.files) {
        if (
          releaseFiles.includes(file.filename) &&
          !changedFiles.includes(file.filename)
        ) {
          changedFiles.push(file.filename);
        }
      }
    }

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: changedFiles.length,
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
