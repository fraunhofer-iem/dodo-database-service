import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { count } from 'console';
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
    this.logger.log(
      `getting the ${limit} most changed files for ${repoIdent.owner}/${repoIdent.repo}`,
    );
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
      .sort({ count: -1 })
      .limit(limit)
      .exec();

    let avg = 0;
    res.forEach((e) => {
      this.logger.debug(e);
      avg += e.count;
    });
    avg = avg / res.length;
    this.logger.log(
      `Calculation of most changed files for ${repoIdent.owner}/${repoIdent.repo} finished. Retrieved ${res.length} files. Average changes to the first files: ${avg}`,
    );
  }
}
