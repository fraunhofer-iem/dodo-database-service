import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RepositoryNameDto } from 'src/github-api/model/Repository';
import { DiffDocument } from './schemas/diff.schema';
import { PullRequestDocument } from './schemas/pullRequest.schema';
import { PullRequestFileDocument } from './schemas/pullRequestFile.schema';
import { RepositoryDocument } from './schemas/repository.schema';
import { RepositoryFileDocument } from './schemas/repositoryFile.schema';
import { IssueDocument } from './schemas/issue.schema';
import { IssueEventTypesDocument } from './schemas/issueEventTypes.schema';
import { LabelDocument } from './schemas/labels.schema';
import { AssigneeDocument } from './schemas/assignee.schema';
import { AssigneesDocument } from './schemas/assignees.schema';
import { MilestoneDocument } from './schemas/milestone.schema';
import { Pull_requestDocument } from './schemas/pull_request.schema';


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
    @InjectModel('Diff') 
    private readonly diffModel: Model<DiffDocument>,
    @InjectModel('Issue') 
    private readonly issueModel: Model<IssueDocument>,
    @InjectModel('IssueEventTypes') 
    private readonly issueEventTypesModel: Model<IssueEventTypesDocument>,
    @InjectModel('Label') 
    private readonly labelModel: Model<LabelDocument>,
    @InjectModel('Assignee') 
    private readonly assigneeModel: Model<AssigneeDocument>,
    @InjectModel('Assignees') 
    private readonly assigneesModel: Model<AssigneesDocument>,
    @InjectModel('Milestone') 
    private readonly milestoneModel: Model<MilestoneDocument>,
    @InjectModel('Pull_request') 
    private readonly pull_requestModel: Model<Pull_requestDocument>,
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
    repoIdent: RepositoryNameDto,
  ) {
   
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

/**
 * Calculate the change in the pullrequests
 * @param repoIdent 
 * @param userLimit 
 */
async sizeOfPullRequest(
  repoIdent: RepositoryNameDto,
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

/**
 * Number of issues with no assignees
 */
 async numberOfAssignee( repoIdent: RepositoryNameDto,){
  const filter = {
    repo: repoIdent.repo,
    owner: repoIdent.owner,
  };

  const getIssues = {
    from: 'issues',
    localField: 'issues',
    foreignField: '_id',
    as: 'expandedIssues',
  };

  const getPull_requests = {
    from: 'pull_requests',
    localField: 'expandedIssues.pull_request',
    foreignField: '_id',
    as: 'pullRequestss',
  };

  const getAssignees = {
    from: 'assignees',
    localField: 'expandedIssues.assignee',
    foreignField: '_id',
    as: 'assigneee',
  };
  
  const res: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$issues')
      .lookup(getIssues)
      .lookup(getPull_requests)
      .unwind('$pullRequestss')
      .lookup(getAssignees)
      .unwind('$assigneee')
      .match({'pullRequestss.url' : {$exists : false}})
      .match({'assigneee.login' : {$exists: false}}) 
      .exec();
      this.logger.log(`Number of issues with no assignee are ${res.length}.`);
}

/**
 * Calculate the number of open tickets
 * @param repoIdent 
 */
  async numberOfOpenTickets(repoIdent: RepositoryNameDto,){
    const filter = {
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    };
  
    const getIssues = {
      from: 'issues',
      localField: 'issues',
      foreignField: '_id',
      as: 'expandedIssues',
    };
  
    const getPull_requests = {
      from: 'pull_requests',
      localField: 'expandedIssues.pull_request',
      foreignField: '_id',
      as: 'pullRequestss',
    };
  
    const getAssignees = {
      from: 'assignees',
      localField: 'expandedIssues.assignee',
      foreignField: '_id',
      as: 'assigneee',
    };
    
    const res: { _id: string; count: number }[] = await this.repoModel
        .aggregate()
        .match(filter)
        .unwind('$issues')
        .lookup(getIssues)
        .unwind('$expandedIssues')
        .lookup(getPull_requests)
        .unwind('$pullRequestss')
        .lookup(getAssignees)
        .unwind('$assigneee')
        .match({'pullRequestss.url' : {$exists : false}})
        .match({ 'expandedIssues.state' : "open"})
        .exec();
  this.logger.log(`Number of open issues are ${res.length}.`); 
 // this.logger.log(res[1]);
  }

/**
 * Calculate Avg Number of assignees until the ticket closes
 * Calculations involve only tickets which are closed
 * find the tickets which are closed, if assignees is null count them, if assignees is not null count number of assignees
 * @param repoIdent 
 */
 async avgNumberOfAssigneeUntilTicketCloses(repoIdent: RepositoryNameDto,){
  const filter = {
    repo: repoIdent.repo,
    owner: repoIdent.owner,
  };

  const getIssues = {
    from: 'issues',
    localField: 'issues',
    foreignField: '_id',
    as: 'expandedIssues',
  };

  const getPull_requests = {
    from: 'pull_requests',
    localField: 'expandedIssues.pull_request',
    foreignField: '_id',
    as: 'pullRequestss',
  };

  const getAssignees = {
    from: 'assignees',
    localField: 'expandedIssues.assignee',
    foreignField: '_id',
    as: 'assigneee',
  };
  
  const res: { _id: string; count: number }[] = await this.repoModel
      .aggregate()
      .match(filter)
      .unwind('$issues')
      .lookup(getIssues)
      .unwind('$expandedIssues')
      .lookup(getPull_requests)
      .unwind('$pullRequestss')
      .lookup(getAssignees)
      .unwind('$assigneee')
      .match({'pullRequestss.url' : {$exists : false}})
      .match({ 'expandedIssues.state' : "closed"})
//      .addFields({count : {}})
      .match({'expandedIssues.assignees' : {$exists : false}})
      .exec();

    //  this.logger.log(`Closed Tickets with only a single assignee ${res.length}.`); 

  const res1: { _id: string; count: number }[] = await this.repoModel
        .aggregate()
        .match(filter)
        .unwind('$issues')
        .lookup(getIssues)
        .unwind('$expandedIssues')
        .lookup(getPull_requests)
        .unwind('$pullRequestss')
        .lookup(getAssignees)
        .unwind('$assigneee')
        .match({'pullRequestss.url' : {$exists : false}})
        .match({ 'expandedIssues.state' : "closed"})
  //      .addFields({count : {}})
        .match({'expandedIssues.assignees' : {$exists : true}})
        //.group({'expandedIssues.count1' : {$size : 'expandedIssues.assignees'}})
      // .group({$cond : { $if : {'expandedIssues.assignees' : {$exists : true}}, $then: {_id : null, totalsize : {$sum : {$size : '$expandedIssues.assignees'}}, numberofticket : { $sum: 1 }} }})
        .group({_id : null, totalsize : {$sum : {$size : '$expandedIssues.assignees'}}, numberofticket : { $sum: 1 }})
      // .addFields({count1 : {$add : {$size:'expandedIssues.assignees' }}})
      // .addFields({count1 : {{$inc : {count1 : {$size : 'expandedIssues.assignees'}}}}})
        .exec();

    const totalClosedTickets = res.length + res1[0]["numberofticket"];
    const avg = (res.length + res1[0]["totalsize"])/totalClosedTickets;
    this.logger.log(`Average number of assignee(s) per ticket until the ticket closes are ${avg}.`);
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
