import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../../../entities/users/user.service';
import { CommitService } from '../../../entities/commits/commit.service';
import { RepositoryIdentifier } from '../../../entities/repositories/model';
import { RepositoryService } from '../../../entities/repositories/repository.service';

@Injectable()
export class DeveloperSpreadService {
  private readonly logger = new Logger(DeveloperSpreadService.name);

  constructor(
    private readonly userService: UserService,
    private readonly commitService: CommitService,
    private readonly repoService: RepositoryService,
  ) {}

  async developerSpread(repo: RepositoryIdentifier) {
    const pipeline = this.repoService.preAggregate(repo, {
      issues: { events: { actor: true } },
    });
    const result = await pipeline.exec();
    console.log(result);
    // console.log(result.events);
    // for (const repo of result) {
    // console.log(repo.events);
    // console.log(repo.issues);
    // for (const issue of repo.issues) {
    //   console.log(issue);
    // }
    // }
  }
}
