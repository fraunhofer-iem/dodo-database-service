import { Injectable, Logger } from '@nestjs/common';
import { sum } from 'lodash';
import { CommitService } from 'src/entities/commits/commit.service';
import { RepositoryFile } from 'src/entities/repositoryFiles/model/schemas';

@Injectable()
export class ActiveCodeService {
  private readonly logger = new Logger(ActiveCodeService.name);

  constructor(private commitService: CommitService) {}

  async changesPerFile(
    repoId: string,
    since: string,
    to: string,
    files: RepositoryFile[],
  ): Promise<{ [key: string]: number }> {
    const result: { _id: string; changes: number }[] = await this.commitService
      .preAggregate(
        {
          repo: repoId,
        },
        {
          files: true,
          since: since,
          to: to,
        },
      )
      .unwind('$files')
      .group({
        _id: '$files.filename',
        changes: { $sum: 1 },
      })
      .exec();

    const changesPerFile: { [key: string]: number } = Object.fromEntries(
      files.map((file) => [file.path, 0]),
    );
    for (const { _id, changes } of result) {
      if (changes > 0) {
        this.logger.debug('' + _id + ': ' + changes);
      }
      changesPerFile[_id] = changes;
    }

    return changesPerFile;
  }

  async avgChangesPerFile(data: {
    changesPerFile: { [key: string]: number };
  }): Promise<number> {
    const { changesPerFile } = data;
    return (
      sum(Object.values(changesPerFile)) / Object.values(changesPerFile).length
    );
  }

  async changesPerRepo(data: {
    changesPerFile: { [key: string]: number };
  }): Promise<number> {
    const { changesPerFile } = data;
    return sum(Object.values(changesPerFile));
  }

  async stdChangesPerFile(data: {
    avgChangesPerFile: number;
    changesPerFile: { [key: string]: number };
  }): Promise<number> {
    const { avgChangesPerFile, changesPerFile } = data;
    return Math.sqrt(
      sum(
        Object.values(changesPerFile).map((changes) =>
          Math.pow(changes - avgChangesPerFile, 2),
        ),
      ) / Object.values(changesPerFile).length,
    );
  }

  async activeCode(data: {
    stdChangesPerFile: number;
    changesPerRepo: number;
  }): Promise<number> {
    const { stdChangesPerFile, changesPerRepo } = data;
    return 1 - (3 * stdChangesPerFile) / changesPerRepo;
  }

  async meanActiveCode(data: { activeCode: number[] }): Promise<number> {
    const { activeCode } = data;
    return sum(activeCode) / activeCode.length;
  }
}
