import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RepositoryService } from '../repositories/repository.service';
import { OCTOKIT, updateArray } from '../lib';
import { User } from '../model';
import { OrganizationDocument } from './model/schemas';

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
    const repos = await OCTOKIT.rest.repos
      .listForOrg({ org: owner, page: pageNumber, per_page: 100 })
      .then((res) => {
        if (repoNames) {
          return res.data.filter((repo) => repoNames.includes(repo.name));
        } else {
          return res.data;
        }
      });

    repos.forEach((repo) =>
      this.repoService.initializeRepository({ owner: owner, repo: repo.name }),
    );

    if (repos.length == 100) {
      this.addRepos(owner, repoNames, pageNumber + 1);
    }
  }

  private async addOrgaMembers(id: string, owner: string, pageNumber = 1) {
    const orgMembers: User[] = await OCTOKIT.rest.orgs
      .listMembers({
        org: owner,
        page: pageNumber,
        per_page: 100,
      })
      .then((res) => res.data);

    updateArray(this.orgModel, id, { members: orgMembers });

    if (orgMembers.length == 100) {
      this.addOrgaMembers(id, owner, pageNumber + 1);
    }

    return orgMembers;
  }
}
