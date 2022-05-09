import { Injectable, Logger } from '@nestjs/common';
import { CommitService } from 'src/entities/commits/commit.service';
import { DiffService } from 'src/entities/diffs/diff.service';
import { Diff } from 'src/entities/diffs/model';
import { IssueService } from 'src/entities/issues/issue.service';
import { ReleaseService } from 'src/entities/releases/release.service';
import { RepositoryDocument } from 'src/entities/repositories/model/schemas';
import { DodoTarget } from '../targets/model/schemas';
import {
  issueQuerier,
  issueEventQuerier,
  commitQuerier,
  releaseQuerier,
  pullRequestQuerier,
  getPullRequestFiles,
  getRepoFiles,
} from './lib';

@Injectable()
export class DataExtractionService {
  private readonly logger = new Logger(DataExtractionService.name);

  constructor(
    private issueService: IssueService,
    private commitService: CommitService,
    private releaseService: ReleaseService,
    private diffService: DiffService,
  ) {}

  public async extractIssues(repo: RepositoryDocument, target: DodoTarget) {
    for await (const issue of issueQuerier(target)) {
      this.logger.log(`Issue ${issue.number}`);
      const issueDocument = await this.issueService.create(issue);
      for await (const event of issueEventQuerier(target, issue.number)) {
        issueDocument.events.push(event);
        await issueDocument.save();
      }
      repo.issues.push(issueDocument);
      await repo.save();
    }
  }

  public async extractCommits(repo: RepositoryDocument, target: DodoTarget) {
    for await (const commit of commitQuerier(target)) {
      this.logger.log(`Commit ${commit.url}`);
      const commitDocument = await this.commitService.create({
        ...commit,
        repo,
      });
      repo.commits.push(commitDocument);
      await repo.save();
    }
  }

  public async extractReleases(repo: RepositoryDocument, target: DodoTarget) {
    for await (const release of releaseQuerier(target)) {
      this.logger.log(`Release ${release.name}`);
      const releaseDocument = await this.releaseService.create({
        ...release,
        repo,
      });
      repo.releases.push(releaseDocument);
      await repo.save();
    }
  }

  public async extractDiffs(repo: RepositoryDocument, target: DodoTarget) {
    for await (const pullRequest of pullRequestQuerier(target)) {
      this.logger.log(`Pull request ${pullRequest.number}`);
      const diff: Diff = {
        pullRequest: pullRequest,
        pullRequestFiles: await getPullRequestFiles(target, pullRequest),
        repositoryFiles: await getRepoFiles(target, pullRequest),
      };
      const diffDocument = await this.diffService.create(diff);
      repo.diffs.push(diffDocument);
      await repo.save();
    }
  }
}
