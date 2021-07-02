import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RepositoryIdentifierDto } from 'src/github-api/model/RepositoryIdentifierDto';
import { DiffDocument } from './schemas/diff.schema';
import { PullRequestDocument } from './schemas/pullRequest.schema';
import { PullRequestFileDocument } from './schemas/pullRequestFile.schema';
import { RepositoryDocument } from './schemas/repository.schema';
import { RepositoryFileDocument } from './schemas/repositoryFile.schema';

@Injectable()
export class StatisticService {
  private readonly logger = new Logger(StatisticService.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
    @InjectModel('RepositoryFiles')
    private readonly repoFileModel: Model<RepositoryFileDocument>,
    @InjectModel('PullRequestFiles')
    private readonly pullFileModel: Model<PullRequestFileDocument>,
    @InjectModel('PullRequest')
    private readonly pullRequestModel: Model<PullRequestDocument>,
    @InjectModel('Diff') private readonly diffModel: Model<DiffDocument>,
  ) {}

  /**
   *
   * @param repoIdent
   * @param limit a maximum of 100 files is returned
   */
  async getMostChangedFiles(
    repoIdent: RepositoryIdentifierDto,
    userLimit?: number,
  ) {
    const limit = userLimit ? userLimit : 100;

    const filter = {
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    };

    const group = {
      _id: '$pullFiles.filename',
      count: { $sum: 1 },
    };

    const getDiffs = {
      from: 'diffs',
      localField: 'diffs',
      foreignField: '_id',
      as: 'expandedDiffs',
    };

    const getPullFiles = {
      from: 'pullrequestfiles',
      localField: 'expandedDiffs.pullRequestFiles',
      foreignField: '_id',
      as: 'pullFiles',
    };

    const res: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$diffs')
      .lookup(getDiffs)
      .lookup(getPullFiles)
      .unwind('$pullFiles')
      .group(group)
      .limit(limit)
      .sort({ count: -1 })
      .exec();
    res.forEach((e) => {
      this.logger.debug(e);
    });
  }
}

// const filesChangeCount = diffs.reduce((acc, curr) => {
//     curr.featFiles.forEach((featFile) => {
//       if (acc.has(featFile.filename)) {
//         const counter = acc.get(featFile.filename)! + 1;
//         acc.set(featFile.filename, counter);
//       } else {
//         acc.set(featFile.filename, 1);
//       }
//     });
//     return acc;
//   }, new Map<string, number>());

//   let averageChanges = 0;
//   let mostChangedFile: [string, number] = ["empty", 0];
//   filesChangeCount.forEach((v, k) => {
//     averageChanges = averageChanges + v;
//     if (v > mostChangedFile[1]) {
//       mostChangedFile = [k, v];
//     }
//   });
//   averageChanges = averageChanges / filesChangeCount.size;
//   const res = diffs.map((diff) => {
//     return {
//       ...diff,
//       percentageChangedFiles:
//         diff.featFiles.length / diff.mergeTargetFiles.length,
//     };
//   });
