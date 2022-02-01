import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RepositoryService } from '../repositories/repository.service';
import { updateArray, documentExists } from '../lib';
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
    this.logger.log(`creating org for ${owner}`);
    const { _id: id } = await this.getOrg(owner);
    // TODO: this can be done in parallel and there should be no awaits
    // necessary. will keep them for now for better testability and
    // more stability in local runs.
    await this.addRepos(owner, id, repoNames);
    await this.addOrgaMembers(id, owner);
  }

  /**
   * Creates org in database if it doesn't exist already.
   * Else returns existing org.
   */
  private async getOrg(owner: string): Promise<OrganizationDocument> {
    if (await documentExists(this.orgModel, { owner: owner })) {
      this.logger.log(`Database entry for ${owner} already exists`);
      return this.orgModel.findOne({ owner: owner });
    } else {
      this.logger.log(`Entry for ${owner} will be created`);
      return this.orgModel.create({
        owner: owner,
        members: [],
        repositories: [],
      });
    }
  }

  private async addRepos(
    owner: string,
    id: string,
    repoNames?: string[],
    pageNumber = 1,
  ) {
    const repos = await queryRepos(owner, pageNumber, repoNames);

    repos.forEach(async (repo) => {
      this.logger.log(`initializing repo ${repo.name}`);
      const currRepos = await this.repoService.initializeRepository({
        owner: owner,
        repo: repo.name,
      });
      updateArray(this.orgModel, id, { repositories: currRepos });
    });

    if (repos.length == 100) {
      this.addRepos(owner, id, repoNames, pageNumber + 1);
    }
  }

  private async addOrgaMembers(id: string, owner: string, pageNumber = 1) {
    const orgMembers: User[] = await queryMembers(owner, pageNumber);
    // TODO: add exists check
    updateArray(this.orgModel, id, { members: orgMembers });

    if (orgMembers.length == 100) {
      this.addOrgaMembers(id, owner, pageNumber + 1);
    }

    return orgMembers;
  }
}
