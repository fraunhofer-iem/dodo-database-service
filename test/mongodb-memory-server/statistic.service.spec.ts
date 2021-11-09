import { Db } from "mongodb";
import { Collection } from 'mongoose';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GithubApiModule } from '../../src/github-api/github-api.module';
import { DatabaseModule } from '../../src/database/database.module';
import { Test } from "@nestjs/testing";
import { StatisticService } from "../../src/database/statistic.service";
import { DatabaseService } from "../../src/database/database.service";
import { TestData } from "test/mongodb-memory-server/sampleData"
import { TestDbHelper } from "test/mongodb-memory-server/testDbHelper"

describe('StatisticService', () => {
  let dbHelper: TestDbHelper
  let databaseService: DatabaseService
  let statisticService: StatisticService
  let testData: TestData
  
  beforeAll( async () => {
    const uri = dbHelper.start();
    const testMod = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(await uri),
        DatabaseModule,
        GithubApiModule,
      ],
      providers: [StatisticService, DatabaseService]
    }).compile();
    databaseService = testMod.get(DatabaseService)
    statisticService = testMod.get(StatisticService)
    // fill testDb
    // repo 1
    let repoId1 = databaseService.createRepo(testData.getCreateRepo1())
    for (let pullReqDiff of testData.getDiffs1()) {
      databaseService.savePullRequestDiff(await repoId1, pullReqDiff)
    }
    for (let release of testData.getReleases1()) {
      databaseService.saveReleases(release, await repoId1)
    }
    for (let issue of testData.getIssues()) {
      databaseService.saveIssue(issue, await repoId1)
    }
    // repo 2
    let repoId2 = databaseService.createRepo(testData.getCreateRepo2())
    for (let pullReqDiff of testData.getDiffs2()) {
      databaseService.savePullRequestDiff(await repoId2, pullReqDiff)
    }
    for (let release of testData.getReleases2()) {
      databaseService.saveReleases(release, await repoId2)
    }
    for (let issue of testData.getIssues()) {
      databaseService.saveIssue(issue, await repoId2)
    }
  });

  afterAll(async () => {
    dbHelper.stop();
    dbHelper.cleanup();
  })

  describe('getMostChangedFiles', () => {
    it('should return avarage of most changed files per pull request', async () => {
      const expectedAvg = 1.714285714
      const avg = await statisticService.getMostChangedFiles(testData.getRepoDto2())
      expect(avg).toEqual(expectedAvg)
    });
  });

});

