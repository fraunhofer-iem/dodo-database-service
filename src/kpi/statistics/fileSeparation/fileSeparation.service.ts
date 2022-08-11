import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { sum } from 'lodash';
import { CommitService } from '../../../entities/commits/commit.service';
import { Commit } from '../../../entities/commits/model/schemas';
import { CalculationEventPayload, transformMapToObject } from '../lib';

@Injectable()
export class FileSeparationService {
  private readonly logger = new Logger(FileSeparationService.name);

  constructor(
    private commitService: CommitService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('kpi.prepared.addFilesChanged')
  async additionalFilesChanged(payload: CalculationEventPayload) {
    const { kpi, since, release } = payload;

    const commits: Commit[] = await this.commitService
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
      .exec();

    const filePairings: Map<string, Set<string>> = new Map<
      string,
      Set<string>
    >();
    release.files.forEach((file) =>
      filePairings.set(file.path, new Set<string>()),
    );
    console.log(release.name, commits.length, since, release.published_at);
    for (const commit of commits) {
      for (const file of commit.files) {
        for (const partner of commit.files) {
          if (
            file.filename !== partner.filename &&
            filePairings.has(file.filename)
          ) {
            filePairings.get(file.filename).add(partner.filename);
          }
        }
      }
    }
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: transformMapToObject(filePairings, (value: Set<string>) =>
        Array.from(value),
      ),
    });
  }

  @OnEvent('kpi.prepared.avgAddFilesChanged')
  async avgAddFilesChanged(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { addFilesChanged } = data;

    console.log(release.name, addFilesChanged);

    const avgFilesChanged =
      sum(
        Object.values(addFilesChanged).map(
          (filePairings: string[]) => filePairings.length,
        ),
      ) / Object.keys(addFilesChanged).length;

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: avgFilesChanged,
    });
  }

  @OnEvent('kpi.prepared.addFilesChangedRepo')
  async addFilesChangedRepo(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { addFilesChanged } = data;

    const addFilesChangedRepo = sum(
      Object.values(addFilesChanged).map(
        (filePairings: string[]) => filePairings.length,
      ),
    );

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: addFilesChangedRepo,
    });
  }

  @OnEvent('kpi.prepared.stdAddFilesChanged')
  async stdAddFilesChanged(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { addFilesChanged, avgAddFilesChanged } = data;

    const stdAddFilesChanged = Math.sqrt(
      sum(
        Object.values(addFilesChanged).map((fileParings: string[]) =>
          Math.pow(fileParings.length - avgAddFilesChanged, 2),
        ),
      ) / Object.values(addFilesChanged).length,
    );

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: stdAddFilesChanged,
    });
  }

  @OnEvent('kpi.prepared.fileSeparation')
  async fileSeparation(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { stdAddFilesChanged, addFilesChangedRepo } = data;

    const fileSeparation = (3 * stdAddFilesChanged) / addFilesChangedRepo;

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: fileSeparation,
    });
  }
}
