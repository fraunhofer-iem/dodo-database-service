import { Injectable, Logger } from '@nestjs/common';
import { ReleaseDocument } from 'src/entities/releases/model/schemas';
import { CommitService } from '../../entities/commits/commit.service';
import { DiffFile } from '../../entities/diffFiles/model/schemas';
import { DiffService } from '../../entities/diffs/diff.service';
import { Diff } from '../../entities/diffs/model';
import { IssueEvent } from '../../entities/issueEvents/model/schemas';
import { IssueService } from '../../entities/issues/issue.service';
import { ReleaseService } from '../../entities/releases/release.service';
import { RepositoryDocument } from '../../entities/repositories/model/schemas';
import { RepositoryFileService } from '../../entities/repositoryFiles/repositoryFile.service';
import { DodoTarget } from '../targets/model/schemas';
import {
  commitQuerier,
  getPullRequestFiles,
  getRepoFiles,
  getTag,
  issueEventQuerier,
  issueQuerier,
  pullRequestQuerier,
  releaseQuerier,
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
    const releases = await this.releaseService
      .preAggregate({ repo: repo._id }, {})
      .sort({
        published_at: 1,
      })
      .exec();
    let previousRelease: ReleaseDocument | undefined = undefined;
    repo.commits = [];
    for (const release of releases) {
      this.logger.debug(`Extracting commits of release ${release.name}`);
      const releaseDocument = await this.releaseService.read({
        _id: release._id,
      });
      releaseDocument.commits = [];
      for await (const commit of commitQuerier(
        target,
        release,
        previousRelease,
      )) {
        this.logger.log(`Commit ${commit.url}`);
        let commitDocument = await this.commitService.read({ url: commit.url });
        if (!commitDocument) {
          const files: DiffFile[] = [];
          for await (const file of commitFileQuerier(target, commit)) {
            files.push(file);
          }
          commitDocument = await this.commitService.create({
            ...commit,
            repo,
            files,
          });
        }
        repo.commits.push(commitDocument);
        await repo.save();
        releaseDocument.commits.push(commitDocument);
        await releaseDocument.save();
      }
      previousRelease = release;
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
