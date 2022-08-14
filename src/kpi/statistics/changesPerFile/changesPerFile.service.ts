import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { sum } from 'lodash';
import { Commit } from 'src/entities/commits/model/schemas';
import { CommitService } from '../../../entities/commits/commit.service';
import { CalculationEventPayload, transformMapToObject } from '../lib';

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

    const changesPerFile: Map<string, number> = new Map();
    for (const file of release.files) {
      changesPerFile.set(file.path, 0);
    }
    for (const commit of commits) {
      for (const file of commit.files) {
        if (changesPerFile.has(file.filename)) {
          changesPerFile.set(
            file.filename,
            changesPerFile.get(file.filename) + 1,
          );
        }
      }
    }

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: transformMapToObject(changesPerFile),
    });
  }

  @OnEvent('kpi.prepared.avgChangesPerFile')
  public async avgChangesPerFile(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { changesPerFile } = data;

    const avgChangesPerFile =
      sum(Object.values(changesPerFile)) / Object.keys(changesPerFile).length;
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: avgChangesPerFile,
    });
  }
}
