import { Injectable, Logger } from '@nestjs/common';
import { PullRequestService } from 'src/entities/pullRequests/pullRequest.service';
import { Release, ReleaseDocument } from 'src/entities/releases/model/schemas';
import { RepositoryService } from 'src/entities/repositories/repository.service';
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
    private repositoryService: RepositoryService,
    private pullRequestService: PullRequestService,
  ) {}

  public async extractIssues(repo: RepositoryDocument, target: DodoTarget) {
    for await (const issue of issueQuerier(target)) {
      this.logger.log(`Issue ${issue.number}`);
      const events: IssueEvent[] = [];
      for await (const event of issueEventQuerier(target, issue.number)) {
        events.push(event);
      }
      try {
        const issueDocument = await this.issueService.create({
          ...issue,
          repo,
          events,
        });
        repo.issues.push(issueDocument);
        await repo.save();
      } catch (e) {
        if (e.message == 'Error: Issue does already exist') {
          console.log('skip this issue');
          continue;
        }
      }
    }
  }

  public async deleteEmptyReleases(
    repo: RepositoryDocument,
    target: DodoTarget,
  ) {
    this.logger.debug('Delete releases with empty commits');
    const releases = await this.releaseService
      .preAggregate({ repo: repo._id }, {})
      .sort({
        published_at: 1,
      })
      .match({ commits: { $size: 0 } })
      .exec();
    console.log(releases.length);
    for (const release of releases) {
      console.log(release.name);
      const releaseDocument = await this.releaseService.read({
        _id: release._id,
      });
      releaseDocument.delete();
      console.log('deleted release');
    }
  }

  public async deleteEmptyReleasesFromRepoDocument(
    repo: RepositoryDocument,
    target: DodoTarget,
  ) {
    this.logger.debug(
      'Delete releases which have been deleted because they are empty from release array in the repo document',
    );
    const repositoryReleases = repo.releases;
    console.log(repositoryReleases);
    console.log(repositoryReleases.length);
    const releasesLeft: Release[] = [];
    for (const release of repositoryReleases) {
      const releaseID = release.toString();
      const releaseDocument = await this.releaseService.releaseExists(
        releaseID,
      );
      if (releaseDocument) {
        console.log('Exists');
        releasesLeft.push(release);
      } else {
        console.log('Not exists');
      }
      // get the releases now. put the existing ones in a new array and update the repository document
    }
    repo.releases = releasesLeft;
    repo.save();
    console.log(repo.releases);
    console.log(repo.releases.length);
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
      try {
        let commits = false;
        for await (const commit of commitQuerier(
          target,
          release,
          previousRelease,
        )) {
          commits = true;
          this.logger.log(`Commit ${commit.url}`);
          let commitDocument = await this.commitService.read({
            url: commit.url,
          });
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
        if (!commits) {
          this.logger.debug(
            'No commits fetched for this release - delete release',
          );
          releaseDocument.delete();
        }
        previousRelease = release;
      } catch (e) {
        if (e.message == 'HTTP Error: Not found') {
          this.logger.debug('Skip current release - No commits found');
          // delete it then?
          await releaseDocument.delete();
          continue;
        }
      }
    }
  }

  public async extractReleases(repo: RepositoryDocument, target: DodoTarget) {
    this.logger.debug('Releases');
    for await (const release of releaseQuerier(target)) {
      this.logger.log(`Release ${release.name}`);
      try {
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
      } catch (e) {
        if (e.message == 'Release does already exist') {
          this.logger.debug('Skip current release');
          continue;
        } else {
          this.logger.debug(
            'No sha for the commit - Do not store current release as it contains no data',
          );
          continue;
        }
        // const files = [];
        // const releaseDocument = await this.releaseService.create({
        //   ...release,
        //   repo,
        //   files,
        // });
        // repo.releases.push(releaseDocument);
        // await repo.save();
      }
    }
  }

  public async extractDiffs(repo: RepositoryDocument, target: DodoTarget) {
    this.logger.debug('Diffs');
    function sleep(milliseconds) {
      return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }
    for await (const pullRequest of pullRequestQuerier(target)) {
      this.logger.log(`Pull request ${pullRequest.number}`);
      if (pullRequest.number === 2974) {
        console.log('jetzt wird gewartet');
        await sleep(2700000);
      }
      // check if pr exists already. If it does exist already, skip
      const pr = await this.pullRequestService.prExists(pullRequest);
      if (!pr) {
        const diff: Diff = {
          pullRequest: pullRequest,
          files: await getPullRequestFiles(target, pullRequest),
          repositoryFiles: await getRepoFiles(target, pullRequest.base.sha),
        };
        const diffDocument = await this.diffService.create(diff);
        repo.diffs.push(diffDocument);
        await repo.save();
      } else {
        this.logger.log('PR was already fetched - skip this PR');
        continue;
      }
    }
  }
}
