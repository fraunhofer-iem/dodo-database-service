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
  getCommit,
  getPullRequestFiles,
  getRepoFiles,
  getTag,
  issueEventQuerier,
  issueQuerier,
  pullRequestQuerier,
  releaseQuerier,
  tagQuerier,
} from './lib';
import { commitFileQuerier } from './lib/commitFileQuerier';
import { Release as ReleaseInterface } from 'src/entities/releases/model';

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
      if (releaseDocument.commits.length != 0) {
        this.logger.log(`Already fetched releases of ${release.name} - Skip!`);
        continue;
      }
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
        console.log(e.message);
        if (e.message == 'HTTP Error: Not found') {
          this.logger.debug('Skip current release - No commits found');
          // delete it then?
          await releaseDocument.delete();
          continue;
        }
      }
    }
  }

  // only for repos which have no releases and just tags
  public async extractTagsAsReleases(
    repo: RepositoryDocument,
    target: DodoTarget,
  ) {
    this.logger.debug('Tags');
    let id = 0;
    for await (const tag of tagQuerier(target)) {
      this.logger.log('Tag name:', tag.name);
      if (await this.releaseService.isReleaseStored({ node_id: tag.node_id })) {
        this.logger.log('Release (tag) is already stored - continue');
        continue;
      } else {
        try {
          const commit = await getCommit(repo, tag.commit.sha);
          console.log(tag);
          const tagAsRelease: ReleaseInterface = {
            id: id,
            url: tag.commit.url,
            node_id: tag.node_id,
            name: tag.name,
            tag_name: tag.name,
            created_at: commit.commit.author.date,
            published_at: commit.commit.author.date,
          };
          const files = await getRepoFiles(
            target,
            tag.commit.sha,
            tag.name,
            this.repoFileService,
          );
          const releaseDocument = await this.releaseService.create({
            ...tagAsRelease,
            repo,
            files,
          });
          this.logger.debug('Release document:');
          console.log(releaseDocument);
          this.logger.debug('STORED RELEASE');
          repo.releases.push(releaseDocument);
          await repo.save();
          id += 1;
        } catch (e) {
          this.logger.error('Something went wrong:');
          this.logger.log(e.message);
          continue;
        }
      }
    }
  }

  public async extractReleases(repo: RepositoryDocument, target: DodoTarget) {
    this.logger.debug('Releases');
    for await (const release of releaseQuerier(target)) {
      this.logger.log(`Release ${release.name}`);
      this.logger.log('Tag name:', release.tag_name);
      this.logger.log(release);
      if (
        await this.releaseService.isReleaseStored({ node_id: release.node_id })
      ) {
        this.logger.log(
          'Release is already stored - push release tag to the release document',
        );
        const releaseDocument = await this.releaseService.read({
          node_id: release.node_id,
        });
        releaseDocument.tag_name = release.tag_name;
        await releaseDocument.save();
      } else {
        try {
          const tag = await getTag(repo, release.tag_name);
          // this.logger.debug('TAG');
          // this.logger.log(tag);
          // files were fetched by the tag name and sha already
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
          this.logger.debug('Release document:');
          console.log(releaseDocument);
          this.logger.debug('STORED RELEASE');
          repo.releases.push(releaseDocument);
          await repo.save();
        } catch (e) {
          if (e.message == 'Release does already exist') {
            this.logger.debug('Skip current release');
            continue;
          } else {
            console.log(e.message);
            this.logger.debug(
              'No sha for the commit - Do not store current release as it contains no files',
            );
            continue;
          }
        }
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
