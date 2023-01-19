import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { sum } from 'lodash';
import { DiffFileService } from 'src/entities/diffFiles/diffFile.service';
import { DiffFile } from 'src/entities/diffFiles/model/schemas/diffFile.schema';
import { CommitService } from '../../../entities/commits/commit.service';
import { Commit } from '../../../entities/commits/model/schemas';
import { CalculationEventPayload, transformMapToObject } from '../lib';

@Injectable()
export class FileSeparationService {
  private readonly logger = new Logger(FileSeparationService.name);

  constructor(
    private commitService: CommitService,
    private eventEmitter: EventEmitter2,
    private diffFileService: DiffFileService,
  ) {}

  @OnEvent('kpi.prepared.addFilesChanged')
  async additionalFilesChanged(payload: CalculationEventPayload) {
    const { kpi, since, release } = payload;

    // The problem intended to be the patch in diffFiles, which is excluded now.
    // This implementation, if commits need to be fetched separately

    // this.logger.debug(`current release: ${release.name}`);
    // let commits: Commit[] = [];
    // for (const commitID of release.commits) {
    //   this.logger.debug(`commit id ${commitID}`);
    //   const commitArr = await this.commitService
    //     .preAggregate(
    //       {
    //         _id: commitID,
    //       },
    //       {
    //         files: true,
    //       },
    //     )
    //     .exec();
    //   const commit = commitArr[0];
    // console.log(commit);
    // let diffFiles: DiffFile[] = [];
    // for (const diffFileID of commit.files) {
    //   const diffFileArr = await this.diffFileService
    //     .preAggregate({ _id: diffFileID })
    //     .exec();
    //   const diffFile = diffFileArr[0];
    //   diffFiles.push(diffFile);
    // }
    // commit['files'] = diffFiles;
    // console.log(commit);
    //   commits.push(commit);
    // }

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

    const filePairings: Map<string, Set<string>> = new Map<
      string,
      Set<string>
    >();
    release.files.forEach((file) =>
      filePairings.set(file.path, new Set<string>()),
    );

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

    // this is the implementation for large repositories:
    // all files changed in an array for each file
    // led to MongoDB Buffer error over 17MB document size
    // here just store the number of files changed
    const res: { [key: string]: number } = {};
    for (let [key, value] of filePairings) {
      res[key] = value.size;
    }

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: res,
      // value: transformMapToObject(filePairings, (value: Set<string>) =>
      //   Array.from(value),
      // ),
    });
  }

  @OnEvent('kpi.prepared.avgAddFilesChanged')
  async avgAddFilesChanged(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { addFilesChanged } = data;

    // const avgFilesChanged =
    //   sum(
    //     Object.values(addFilesChanged).map(
    //       (filePairings: string[]) => filePairings.length,
    //     ),
    //   ) / Object.keys(addFilesChanged).length;

    // implementation for storing the number of file changes only
    const avgFilesChanged =
      sum(Object.values(addFilesChanged)) / Object.keys(addFilesChanged).length;

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

    // const addFilesChangedRepo = sum(
    //   Object.values(addFilesChanged).map(
    //     (filePairings: string[]) => filePairings.length,
    //   ),
    // );

    // implementation for storing the number of file changes only
    const addFilesChangedRepo = sum(Object.values(addFilesChanged));

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

    // const stdAddFilesChanged = Math.sqrt(
    //   sum(
    //     Object.values(addFilesChanged).map((filePairings: string[]) =>
    //       Math.pow(filePairings.length - avgAddFilesChanged, 2),
    //     ),
    //   ) / Object.keys(addFilesChanged).length,
    // );

    // implementation for storing the number of file changes only
    const stdAddFilesChanged = Math.sqrt(
      sum(
        Object.values(addFilesChanged).map((filePairings: number) =>
          Math.pow(filePairings - avgAddFilesChanged, 2),
        ),
      ) / Object.keys(addFilesChanged).length,
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
      value: isNaN(fileSeparation) ? 0 : fileSeparation,
    });
  }
}
