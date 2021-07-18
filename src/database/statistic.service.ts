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
    this.logger.log(
      `getting the ${limit} most changed files for ${repoIdent.owner}/${repoIdent.repo}`,
    );

    
    const filter = {
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    };

    

    const group = {
      _id: null,
      count: { $count: {} },
    };
/**
 * //{_id: ObjectId(''), diffs: [ObjectID('')], owner: 'octokit', repo: 'rest.js', __v :0 , 
 * expandeddiffs: [{_id : 60ed..., repositoryFiles : , pullRequestFiles}]}
 */
    const getDiffs = {
      from: 'diffs',
      localField: 'diffs',
      foreignField: '_id',
      as: 'expandedDiffs', 
    };
/**
 * {_id: ObjectId(''), diffs: [ObjectID('')], owner: 'octokit', repo: 'rest.js', __v :0 ,
 * expandeddiffs: [{_id : 60ed..., repositoryFiles : , pullRequestFiles}],
 * pullFiles: [{_id : , sha : , filename, status, additions, deleteyions, changes, bloburl}]}
 */
    const getPullFiles = {
      from: 'pullrequestfiles',
      localField: 'expandedDiffs.pullRequestFiles',
      foreignField: '_id',
      as: 'pullFiles',
    };
   // const file = ['package.json', 'package-lock.json'];

    // const filenames = {
    //   '$in' : 

    //   ]
    // };
  

    const res: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$diffs') // {_id: , diffs : object id(), owner: , repo: , _v:  }
      .lookup(getDiffs)
      .lookup(getPullFiles) 
      .match({$and : [{'pullFiles.filename': {$in : ['package.json']}}, {'pullFiles.filename': {$in : ['package-lock.json']}}]})
      //.match({$and : [{'pullFiles.filename': {$in : ['package.json']}}, {'pullFiles.filename': {$in : ['package-lock.json']}}]})

      //how are they matching as pullreqest id in diff is 2 and only one ID
     // .match({'$expandedDiffs.pullRequest' : {$cond : {$if:{'$pullFiles.filename' : {$in : ['package.json', 'package-lock.json']} }}}})
    //   .unwind('$pullFiles') // {_id: ObjectId(''), diffs: [ObjectID('')], owner: 'octokit', repo: 'rest.js', __v :0 , expandeddiffs: {_id : 60ed..., repositoryFiles : , pullRequestFiles}],pullFiles: {_id : , sha : , filename, status, additions, deleteyions, changes, bloburl}}
    //   .match({'$pullFiles.filename': {$in : ['package.json', 'package-lock.json']}})
    //  // .match({$expr : {$and: []}})
    //   .match({$cond : {$if :{'$pullFiles.filename'}}})
    //   .group({_id: '$expandedDiffs.pullRequest', unique: {}})
    //   .group(group)
    //   .sort({ count: -1 })
    //   .limit(limit)
      .exec();

    //  res.forEach(e => {
    //    this.logger.log(e);
    //  });
      this.logger.log(`The files are repeatedly changed together ${res.length} times.`);
    // let avg = 0;
    // res.forEach((e) => {
    //   this.logger.debug(e);
    //   avg += e.count;
    // });

    //this.logger.log(`values of res length ${avg}.`);
    //avg = avg / res.length;
    // this.logger.log(
    //   `Calculation of most changed files for ${repoIdent.owner}/${repoIdent.repo} finished. Retrieved ${res.length} files. Average changes to the first files: ${avg}`,
    // );


  /**
   * 
   */
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
