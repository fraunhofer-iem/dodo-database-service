import { Injectable, Logger } from '@nestjs/common';
import { CommitService } from 'src/entities/commits/commit.service';
import { DiffFile } from 'src/entities/diffFiles/model/schemas';
import { DiffService } from 'src/entities/diffs/diff.service';
import { Diff } from 'src/entities/diffs/model';
import { IssueEvent } from 'src/entities/issueEvents/model/schemas';
import { IssueService } from 'src/entities/issues/issue.service';
import { ReleaseService } from 'src/entities/releases/release.service';
import { RepositoryDocument } from 'src/entities/repositories/model/schemas';
import { RepositoryFileService } from 'src/entities/repositoryFiles/repositoryFile.service';
import { DodoTarget } from '../targets/model/schemas';
import {
  issueQuerier,
  issueEventQuerier,
  commitQuerier,
  releaseQuerier,
  pullRequestQuerier,
  getPullRequestFiles,
  getRepoFiles,
  getTag,
} from './lib';
import { commitFileQuerier } from './lib/commitFileQuerier';

@Injectable()
export class DataExtractionService {
  private readonly logger = new Logger(DataExtractionService.name);

  constructor(
    private issueService: IssueService,
    private commitService: CommitService,
    private releaseService: ReleaseService,
    private repoFileService: RepositoryFileService,
    private diffService: DiffService,
  ) {}

  public async extractIssues(repo: RepositoryDocument, target: DodoTarget) {
    for await (const issue of issueQuerier(target)) {
      this.logger.log(`Issue ${issue.number}`);
      const events: IssueEvent[] = [];
      for await (const event of issueEventQuerier(target, issue.number)) {
        events.push(event);
      }
      const issueDocument = await this.issueService.create({
        ...issue,
        repo,
        events,
      });
      repo.issues.push(issueDocument);
      await repo.save();
    }
  }

  public async extractCommits(repo: RepositoryDocument, target: DodoTarget) {
    this.logger.debug('Commits');
    for await (const commit of commitQuerier(target)) {
      this.logger.log(`Commit ${commit.url}`);
      let files: DiffFile[] = [];
      for await (const file of commitFileQuerier(target, commit)) {
        files.push(file);
      }
      const commitDocument = await this.commitService.create({
        ...commit,
        repo,
        files,
      });
      repo.commits.push(commitDocument);
      await repo.save();
    }
  }

  public async extractReleases(repo: RepositoryDocument, target: DodoTarget) {
    this.logger.debug('Releases');
    for await (const release of releaseQuerier(target)) {
      this.logger.log(`Release ${release.name}`);
      const tag = await getTag(repo, release.tag_name);
      const files = await getRepoFiles(
        target,
        tag.sha,
        release.tag_name,
        this.repoFileService,
      );
      const releaseDocument = await this.releaseService.create({
        ...release,
        repo,
        files,
      });
      repo.releases.push(releaseDocument);
      await repo.save();
    }
  }

  public async extractDiffs(repo: RepositoryDocument, target: DodoTarget) {
    this.logger.debug('Diffs');
    for await (const pullRequest of pullRequestQuerier(target)) {
      this.logger.log(`Pull request ${pullRequest.number}`);
      const diff: Diff = {
        pullRequest: pullRequest,
        files: await getPullRequestFiles(target, pullRequest),
        repositoryFiles: await getRepoFiles(target, pullRequest.base.sha),
      };
      const diffDocument = await this.diffService.create(diff);
      repo.diffs.push(diffDocument);
      await repo.save();
    }
  }
}
