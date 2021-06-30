import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
