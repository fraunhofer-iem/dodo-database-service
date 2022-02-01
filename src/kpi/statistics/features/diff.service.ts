import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RepositoryIdentifier } from '../../../repositories/model';
import { RepositoryDocument } from '../../../repositories/model/schemas';
import { getRepoFilter } from '../lib';
import { getAvg, getMostChangedFiles } from './lib';

@Injectable()
export class DiffService {
  private readonly logger = new Logger(DiffService.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
  ) {}

  /**
   *
   * @param repoIdent
   */
  async getMostChangedFiles(repoIdent: RepositoryIdentifier, limit = 100) {
    this.logger.log(
      `getting most changed files for ${repoIdent.owner}/${repoIdent.repo}`,
    );

    // TODO: we definitly want to include the file name
    const files = await getMostChangedFiles(
      repoIdent,
      this.repoModel,
      limit,
    ).exec();

    const avg = getAvg(files);
    this.logger.log(
      `Calculation of most changed files for ${repoIdent.owner}/${repoIdent.repo} finished. Retrieved ${files.length} files. Average changes to the first files: ${avg}`,
    );

    return { files: files, avg: avg };
  }

  /**
   * This method gives the count of the filenames that are changed together
   * E.g.
   * 1. pullRequestFiles: [File A, File B, File C, File D]
   * 2. pullRequestFiles: [File A, File B, File E, File F]
   * 3. pullRequestFiles: [File A, File B, File X, File Y]
   * 4. pullRequestFiles: [File C, File D, File Z]
   * output: Files A & B changed together 3 times
   * @param repoIdent
   * @param userLimit
   */
  async getFilesChangedTogether(repoIdent: RepositoryIdentifier) {
    const filter = {
      repo: repoIdent.repo,
      owner: repoIdent.owner,
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

    // TODO: we need to do this for all files
    // most likely it would be a good idea to iterate
    // all diffs once, and create a map/counter of which
    // files occured together
    //enter file name here
    const file1 = ['package.json'];
    const file2 = ['package-lock.json'];
    const getFilesNames = {
      $and: [
        { 'pullFiles.filename': { $in: file1 } },
        { 'pullFiles.filename': { $in: file2 } },
      ],
    };

    const res: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$diffs')
      .lookup(getDiffs)
      .lookup(getPullFiles)
      .match(getFilesNames)
      .exec();

    this.logger.log(
      `The files ${file1} & ${file2} are repeatedly changed together ${res.length} times.`,
    );
    return res.length;
  }

  /**
   * Calculate the change in the pullrequests
   * @param repoIdent
   */
  async sizeOfPullRequest(repoIdent: RepositoryIdentifier) {
    const filter = {
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    };

    const getPullRequest = {
      from: 'pullrequests',
      localField: 'expandedDiffs.pullRequest',
      foreignField: '_id',
      as: 'expandedPullRequest',
    };

    const getDiffs = {
      from: 'diffs',
      localField: 'diffs',
      foreignField: '_id',
      as: 'expandedDiffs',
    };

    // we query the ids of the changed files (this is enough, because we just want to count the number)
    // as well as the pull request number to sort the files and label them in the visualization
    const res: {
      _id: string;
      changedFiles: string[];
      pullRequestNumber: number;
    }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$diffs')
      .lookup(getDiffs)
      .lookup(getPullRequest)
      .unwind('$expandedDiffs')
      .unwind('$expandedPullRequest')
      .project({
        changedFiles: '$expandedDiffs.pullRequestFiles',
        pullRequestNumber: '$expandedPullRequest.number',
      })
      .sort({ pullRequestNumber: 1 })
      .exec();

    const numberOfFiles = [];

    res.forEach((e) => {
      // somehow there exist pull requests without changed files. need to investigate
      if ('changedFiles' in e) {
        numberOfFiles.push(e.changedFiles.length);
      }
    });

    const numberOfElements = numberOfFiles.length;
    const avg =
      numberOfFiles.reduce((acc, curr) => {
        return acc + curr;
      }, 0) / numberOfElements;

    const variance = numberOfFiles.reduce((acc, curr) => {
      return acc + Math.pow(curr - avg, 2) / numberOfElements;
    }, 0);

    const standardDeviation = Math.sqrt(variance);
    this.logger.log(
      `constiance ${variance} standard deviation ${standardDeviation}`,
    );
    this.logger.log(
      `In average ${avg} files are changed with each pull request`,
    );

    return {
      numberOfFiles,
      avg,
      variance,
      standardDeviation,
    };
  }
}
