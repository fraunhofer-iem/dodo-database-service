import { RepositorySchema } from "../../src/database/schemas/repository.schema"
import { MongooseModule } from '@nestjs/mongoose';
import { Test } from "@nestjs/testing";
import { GithubApiModule } from '../../src/github-api/github-api.module';
import { DatabaseModule } from '../../src/database/database.module';
import { StatisticService } from "../../src/database/statistic.service";
import { DatabaseService } from "../../src/database/database.service";
import { TestData } from "./sampleData"
import { TestDbHelper } from "./testDbHelper"
import { stat, Stats } from "fs";
import exp from "constants";

describe('StatisticService', () => {
  const dbHelper = new TestDbHelper()
  const testData = new TestData()
  let databaseService: DatabaseService
  let statisticService: StatisticService
  
  beforeAll( async () => {
    const uri = dbHelper.start();
    const testMod = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(await uri),
        DatabaseModule
        //GithubApiModule,
      ],
      providers: [StatisticService, DatabaseService]
    }).compile();
    databaseService = testMod.get(DatabaseService)
    statisticService = testMod.get(StatisticService)
    // fill testDb
    // repo 1
    let repoId1 = databaseService.createRepo(testData.getCreateRepo1())
    for (let pullReqDiff of testData.getDiffs1()) {
      await databaseService.savePullRequestDiff(await repoId1, pullReqDiff)
    }
    for (let release of testData.getReleases1()) {
      await databaseService.saveReleases(release, await repoId1)
    }
    for (let issue of testData.getIssues()) {
      await databaseService.saveIssue(issue, await repoId1)
    }
    // repo 2
    let repoId2 = databaseService.createRepo(testData.getCreateRepo2())
    for (let pullReqDiff of testData.getDiffs2()) {
      await databaseService.savePullRequestDiff(await repoId2, pullReqDiff)
    }
    for (let release of testData.getReleases2()) {
      await databaseService.saveReleases(release, await repoId2)
    }
    for (let issue of testData.getIssues()) {
      await databaseService.saveIssue(issue, await repoId2)
    }
  });

  afterAll( async () => {
    dbHelper.stop();
    dbHelper.cleanup();
  })

  describe('getMostChangedFiles', () => {
    it('should return avarage on how often a changed file in PRs was changed', async () => {
      const expectedAvg = 1.8
      const avg = await statisticService.getMostChangedFiles(testData.getRepoDto2())
      expect(avg).toEqual(expectedAvg)
    });
  });

  describe('getFilesChangedTogether', () => {
    it('should return how often two files, configured in the tested function (--> package.json, package-lock.json) are changed together in one PR', async () => {
      const expectedPRs = 1
      const PRs = await statisticService.getFilesChangedTogether(testData.getRepoDto1())
      expect(PRs).toEqual(expectedPRs)
    });
  });

  describe('sizeOfPullRequest', () => {
    it('should return array with changed files per PR, avg of changed files per PR, variance & SD', async () => {
      const expectedChangedFilesArray = [4, 2, 3]
      const expectedAvg = 3
      const expectedVariance = 0.6666666666666666
      const expectedSD = Math.sqrt(expectedVariance)
      const resObj = await statisticService.sizeOfPullRequest(testData.getRepoDto2())
      expect(resObj.numberOfFiles).toEqual(expectedChangedFilesArray)
      expect(resObj.avg).toEqual(expectedAvg)
      expect(resObj.variance).toEqual(expectedVariance)
      expect(resObj.standardDeviation).toEqual(expectedSD)
    });
  });

  describe('numberOfAssignee', () => {
    it('should return the number of issues with no assignee', async () => {
      const expectedIssues = 1
      const issues = await statisticService.numberOfAssignee(testData.getRepoDto2())
      expect(issues).toEqual(expectedIssues)
    });
  });

  describe('numberOfOpenTickets', () => {
    it('should return the number of all issues which are open, i.e. not closed', async () => {
      const expectedIssues = 1
      const issues = await statisticService.numberOfOpenTickets(testData.getCreateRepo2())
      expect(issues).toEqual(expectedIssues)
    });
  });

  describe('avgNumberOfAssigneeUntilTicketCloses', () => {
    it('should return avg number of assignees per ticket until it is closed', async () => {
      const expectedAvg = 1
      const avg = await statisticService.avgNumberOfAssigneeUntilTicketCloses(testData.getRepoDto2())
      expect(avg).toEqual(expectedAvg)
    });
  });

  describe('avgTimeTillTicketWasAssigned', () => {
    it('should return the avg time until a ticket was assigned', async () => {
      //TODO
    });
  });

  describe('WorkInProgress', () => {
    it('should return avg number of releases per closed issue', async () => {
      // issue 1 and 4 get in calculation
      // releases 2,6 fit for issue 1
      // releases 2,3,4,5,6 fit for issue 2
      const expectedAvg = 3.5
      const avg = await statisticService.workInProgress(testData.getRepoDto1())
      expect(avg).toEqual(expectedAvg)
    });
  });

});

