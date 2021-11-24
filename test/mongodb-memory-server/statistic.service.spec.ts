import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '../../src/database/database.module';
import { StatisticService } from '../../src/database/statistic.service';
import { DatabaseService } from '../../src/database/database.service';
import { TestData } from './sampleData';
import { TestDbHelper } from './testDbHelper';
import { RepositorySchema } from '../../src/database/schemas/repository.schema';
import { DiffSchema } from '../../src/database/schemas/diff.schema';
import { IssueSchema } from '../../src/database/schemas/issue.schema';
import { IssueEventTypesSchema } from '../../src/database/schemas/issueEventTypes.schema';
import { AssigneeSchema } from '../../src/database/schemas/assignee.schema';
import { AssigneesSchema } from '../../src/database/schemas/assignees.schema';
import { IssueWithEventsSchema } from '../../src/database/schemas/issueWithEvents.schema';
import { LabelSchema } from '../../src/database/schemas/labels.schema';
import { LanguageSchema } from '../../src/database/schemas/language.schema';
import { MilestoneSchema } from '../../src/database/schemas/milestone.schema';
import { PullRequestSchema } from '../../src/database/schemas/pullRequest.schema';
import { PullRequestFileSchema } from '../../src/database/schemas/pullRequestFile.schema';
import { ReleasesSchema } from '../../src/database/schemas/releases.schema';
import { RepositoryFileSchema } from '../../src/database/schemas/repositoryFile.schema';

/**
 * test suite for all KPIs from statistic service
 * with in-memory db for efficient tests
 */

describe('StatisticService', () => {
  const dbHelper = new TestDbHelper();
  const testData = new TestData();
  let databaseService: DatabaseService;
  let statisticService: StatisticService;
  let testMod: TestingModule;
  beforeAll(async () => {
    const uri = await dbHelper.start();
    // config testing module
    testMod = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        DatabaseModule,
        MongooseModule.forFeature([
          { name: 'Repository', schema: RepositorySchema },
          { name: 'Diff', schema: DiffSchema },
          { name: 'Issue', schema: IssueSchema },
          { name: 'IssueEventTypes', schema: IssueEventTypesSchema },
          { name: 'Releases', schema: ReleasesSchema },
          { name: 'PullRequest', schema: PullRequestSchema },
          { name: 'PullRequestFiles', schema: PullRequestFileSchema },
          { name: 'RepositoryFiles', schema: RepositoryFileSchema },
          { name: 'Label', schema: LabelSchema },
          { name: 'Assignee', schema: AssigneeSchema },
          { name: 'Assignees', schema: AssigneesSchema },
          { name: 'Milestone', schema: MilestoneSchema },
          { name: 'IssueWithEvents', schema: IssueWithEventsSchema },
          { name: 'Languages', schema: LanguageSchema },
        ]),
      ],
      providers: [StatisticService, DatabaseService],
    }).compile();

    // get Services in testing environment
    databaseService = testMod.get(DatabaseService);
    statisticService = testMod.get(StatisticService);
    // fill testDb
    // repo 1
    const repoId1 = await databaseService.createRepo(testData.getCreateRepo1());
    for (const pullReqDiff of testData.getDiffs1()) {
      await databaseService.savePullRequestDiff(repoId1, pullReqDiff);
    }
    for (const release of testData.getReleases()) {
      await databaseService.saveReleases(release, repoId1);
    }
    for (const issue of testData.getIssues()) {
      await databaseService.saveIssue(issue, repoId1);
    }
    // repo 2
    const repoId2 = databaseService.createRepo(testData.getCreateRepo2());
    for (const pullReqDiff of testData.getDiffs2()) {
      await databaseService.savePullRequestDiff(await repoId2, pullReqDiff);
    }
    for (const release of testData.getReleases()) {
      await databaseService.saveReleases(release, await repoId2);
    }
    // fill issues with events
    const issueEventTypes = testData.getEventTypes();
    let index = 0;
    for (const issue of testData.getIssues()) {
      const issueWithEventID = await databaseService.saveIssue(
        issue,
        await repoId2,
      );
      await databaseService.saveIssueEvent(
        issueEventTypes[index],
        issueWithEventID,
      );
      index += 1;
    }
  });

  afterAll(async () => {
    const mongooseConnection = await testMod.get(getConnectionToken());
    await mongooseConnection.close();
    await dbHelper.cleanup();
    await dbHelper.stop();
  });

  // test cases

  describe('getMostChangedFiles', () => {
    it('should return avarage on how often a changed file in PRs was changed', async () => {
      // see calculation explanation in TestData.getDiffs2()
      // test repo no. 2
      const expectedAvg = 1.8;
      const avg = await statisticService.getMostChangedFiles(
        testData.getRepoDto2(),
      );
      expect(avg).toEqual(expectedAvg);
    });
  });

  describe('getFilesChangedTogether', () => {
    it('should return how often two files, configured in the tested function', async () => {
      // --> package.json, package-lock.json are changed together in one PR
      // test repo no. 1
      const expectedPRs = 1;
      const PRs = await statisticService.getFilesChangedTogether(
        testData.getRepoDto1(),
      );
      expect(PRs).toEqual(expectedPRs);
    });
  });

  describe('sizeOfPullRequest', () => {
    it('should return array with changed files per PR, avg of changed files per PR, variance & SD', async () => {
      // see calculation explanation in TestData.getDiffs2()
      // test repo no. 2
      const expectedChangedFilesArray = [4, 2, 3];
      const expectedAvg = 3;
      const expectedVariance = 0.6666666666666666;
      const expectedSD = Math.sqrt(expectedVariance);
      const resObj = await statisticService.sizeOfPullRequest(
        testData.getRepoDto2(),
      );
      expect(resObj.numberOfFiles).toEqual(expectedChangedFilesArray);
      expect(resObj.avg).toEqual(expectedAvg);
      expect(resObj.variance).toEqual(expectedVariance);
      expect(resObj.standardDeviation).toEqual(expectedSD);
    });
  });

  describe('numberOfAssignee', () => {
    it('should return the number of issues with no assignee', async () => {
      // test repo no. 2
      const expectedIssues = 1;
      const issues = await statisticService.numberOfAssignee(
        testData.getRepoDto2(),
      );
      expect(issues).toEqual(expectedIssues);
    });
  });

  describe('numberOfOpenTickets', () => {
    it('should return the number of all issues which are open, i.e. not closed', async () => {
      // test repo no. 2
      const expectedIssues = 1;
      const issues = await statisticService.numberOfOpenTickets(
        testData.getCreateRepo2(),
      );
      expect(issues).toEqual(expectedIssues);
    });
  });

  describe('avgNumberOfAssigneeUntilTicketCloses', () => {
    it('should return avg number of assignees per ticket until it is closed', async () => {
      // test repo no. 2
      // 1+1+1 assignees / 3 tickets with assignee
      const expectedAvg = 1;
      const avg = await statisticService.avgNumberOfAssigneeUntilTicketCloses(
        testData.getRepoDto2(),
      );
      expect(avg).toEqual(expectedAvg);
    });
  });

  describe('avgTimeTillTicketWasAssigned', () => {
    it('should return the avg time until a ticket was assigned', async () => {
      // see calculation explanation in TestData.getEventTypes()
      // test repo no. 2
      const expectedAvg = '8.2 Hrs';
      const avg = await statisticService.avgTimeTillTicketWasAssigned(
        testData.getRepoDto2(),
      );
      expect(avg).toEqual(expectedAvg);
    });
  });

  describe('WorkInProgress', () => {
    it('should return avg number of releases per closed issue', async () => {
      // test repo no. 2
      // issue 1 and 4 get in calculation
      // releases 2,6 fit for issue 1
      // releases 2,3,4,5,6 fit for issue 2
      const expectedAvg = 3.5;
      const avg = await statisticService.workInProgress(testData.getRepoDto2());
      expect(avg).toEqual(expectedAvg);
    });
  });
});
