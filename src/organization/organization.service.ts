import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RepositoryService } from '../repositories/repository.service';
import { updateArray } from '../lib';
import { User } from '../model';
import { OrganizationDocument } from './model/schemas';
import { queryMembers, queryRepos } from './lib';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    @InjectModel('Organization')
    private readonly orgModel: Model<OrganizationDocument>,
    private repoService: RepositoryService,
  ) {}

  public async initializeOrga(owner: string, repoNames?: string[]) {
    const id = (await this.createOrg(owner))._id;
    // TODO: this can be done in parallel and there should be no awaits
    // necessary. will keep them for now for better testability and
    // more stability in local runs.
    await this.addRepos(owner, repoNames);
    await this.addOrgaMembers(id, owner);
  }

  private async createOrg(owner: string) {
    return this.orgModel.create({
      owner: owner,
      members: [],
      repositories: [],
    });
  }

  private async addRepos(owner: string, repoNames?: string[], pageNumber = 1) {
    const repos = await queryRepos(owner, pageNumber, repoNames);

    repos.forEach((repo) =>
      this.repoService.initializeRepository({ owner: owner, repo: repo.name }),
    );

    if (repos.length == 100) {
      this.addRepos(owner, repoNames, pageNumber + 1);
    }
  }

  private async addOrgaMembers(id: string, owner: string, pageNumber = 1) {
    const orgMembers: User[] = await queryMembers(owner, pageNumber);

    updateArray(this.orgModel, id, { members: orgMembers });

    if (orgMembers.length == 100) {
      this.addOrgaMembers(id, owner, pageNumber + 1);
    }

    return orgMembers;
  }
}
