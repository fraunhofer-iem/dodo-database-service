import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RepositoryNameDto } from 'src/github-api/model/Repository';
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
  async getMostChangedFiles(repoIdent: RepositoryNameDto, userLimit?: number) {
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
    // this.logger.debug(e);
      avg += e.count;
    });

    avg = avg / res.length;
    this.logger.log(
      `Calculation of most changed files for ${repoIdent.owner}/${repoIdent.repo} finished. Retrieved ${res.length} files. Average changes to the first files: ${avg}`,
    );
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
  async getFilesChangedTogether(
    repoIdent: RepositoryIdentifierDto,
   // userLimit?: number,
  ) {
   // const limit = userLimit ? userLimit : 100;
    // this.logger.log(
    //   `getting the ${limit} most changed files for ${repoIdent.owner}/${repoIdent.repo}`,
    // );
    const filter = {
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    };


    const group = {
      _id: null,
      count: { $count: {} },
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

    //enter file name here
    const file1 = ['package.json']
    const file2 = ['package-lock.json']
    const getFilesNames = {
      $and : [{'pullFiles.filename': {$in : file1}}, {'pullFiles.filename': {$in : file2}}]
    };

    const res: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$diffs') 
      .lookup(getDiffs)
      .lookup(getPullFiles) 
      .match(getFilesNames)
      .exec();
    
      this.logger.log(`The files ${file1} & ${file2} are repeatedly changed together ${res.length} times.`);
  }


async sizeOfPullRequest(
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

  const getPullRequests = {
    from: 'pullrequests',
    localField: 'expandedDiffs.pullRequest',
    foreignField: '_id',
    as: 'pullRequests',
  };

  const getPullRequestNumber = {
    _id : '$pullRequests.number'
  };

  const res: { _id: string; count: number }[] = await this.repoModel
    .aggregate()
    .match(filter)
    .unwind('$diffs')
    .lookup(getDiffs)
    .lookup(getPullRequests)
    .group(getPullRequestNumber)
    .sort({_id : 1})
    .exec();

    let fileNumber = []
    res.forEach((e) => {
       fileNumber.push(parseInt(e._id))
      });
  let v1 = fileNumber[0] 
  let v2 = fileNumber[fileNumber.length -1]
  let difference = v2-v1

  console.log(v1, v2, typeof(v2))
  let percent = (difference/(Math.abs(v1)))* 100
  
  let change
  if (percent < 0)
      change = "decrease"
  else
      change = "increase"

  this.logger.log(`There is a ${percent} % change or ${Math.abs(percent)} % ${change} in the size of pull requests.`)
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
// import { Injectable, Logger } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { RepositoryIdentifierDto } from 'src/github-api/model/RepositoryIdentifierDto';
// import { DiffDocument } from './schemas/diff.schema';
// import { PullRequestDocument } from './schemas/pullRequest.schema';
// import { PullRequestFileDocument } from './schemas/pullRequestFile.schema';
// import { RepositoryDocument } from './schemas/repository.schema';
// import { RepositoryFileDocument } from './schemas/repositoryFile.schema';

// @Injectable()
// export class StatisticService {
//   private readonly logger = new Logger(StatisticService.name);

//   constructor(
//     @InjectModel('Repository')
//     private readonly repoModel: Model<RepositoryDocument>,
//     @InjectModel('RepositoryFiles')
//     private readonly repoFileModel: Model<RepositoryFileDocument>,
//     @InjectModel('PullRequestFiles')
//     private readonly pullFileModel: Model<PullRequestFileDocument>,
//     @InjectModel('PullRequest')
//     private readonly pullRequestModel: Model<PullRequestDocument>,
//     @InjectModel('Diff') private readonly diffModel: Model<DiffDocument>,
//   ) {}

//   /**
//    *
//    * @param repoIdent
//    * @param limit a maximum of 100 files is returned
//    */
//   async getMostChangedFiles(
//     repoIdent: RepositoryIdentifierDto,
//     userLimit?: number,
//   ) {
//     const limit = userLimit ? userLimit : 100;
//     this.logger.log(
//       `getting the ${limit} most changed files for ${repoIdent.owner}/${repoIdent.repo}`,
//     );

    
//     const filter = {
//       repo: repoIdent.repo,
//       owner: repoIdent.owner,
//     };

    

//     const group = {
//       _id: null,
//       count: { $count: {} },
//     };
// /**
//  * //{_id: ObjectId(''), diffs: [ObjectID('')], owner: 'octokit', repo: 'rest.js', __v :0 , 
//  * expandeddiffs: [{_id : 60ed..., repositoryFiles : , pullRequestFiles}]}
//  */
//     const getDiffs = {
//       from: 'diffs',
//       localField: 'diffs',
//       foreignField: '_id',
//       as: 'expandedDiffs', 
//     };
// /**
//  * {_id: ObjectId(''), diffs: [ObjectID('')], owner: 'octokit', repo: 'rest.js', __v :0 ,
//  * expandeddiffs: [{_id : 60ed..., repositoryFiles : , pullRequestFiles}],
//  * pullFiles: [{_id : , sha : , filename, status, additions, deleteyions, changes, bloburl}]}
//  */
//     const getPullFiles = {
//       from: 'pullrequestfiles',
//       localField: 'expandedDiffs.pullRequestFiles',
//       foreignField: '_id',
//       as: 'pullFiles',
//     };
//    // const file = ['package.json', 'package-lock.json'];

//     // const filenames = {
//     //   '$in' : 

//     //   ]
//     // };
//     const getFilesNames = {
//       $and : [{'pullFiles.filename': {$in : ['package.json']}}, {'pullFiles.filename': {$in : ['package-lock.json']}}]
//     };

//     const res: { _id: string; count: number }[] = await this.repoModel
//       .aggregate()
//       .match(filter)
//       .unwind('$diffs') // {_id: , diffs : object id(), owner: , repo: , _v:  }
//       .lookup(getDiffs)
//       .lookup(getPullFiles) 
//       .match(getFilesNames)
//       .exec();
    
//       this.logger.log(`The files are repeatedly changed together ${res.length} times.`);
//     }
//   }
  


      //.match({'pullFiles.filename': {$and : [{$in : ['package.json']}, {$in : ['package.json']}}}

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

    //  res.forEach(e => {
    //    this.logger.log(e);
    //  });
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
