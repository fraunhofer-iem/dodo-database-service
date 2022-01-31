import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OCTOKIT, updateArray } from '../lib';
import { User } from '../model';
import { OrganizationDocument } from './model/schemas';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    @InjectModel('Organization')
    private readonly orgModel: Model<OrganizationDocument>,
  ) {}

  public async createOrg(owner: string) {
    await this.orgModel.create({
      owner: owner,
      members: [],
      repositories: [],
    });
  }

  public async orgaMembers(id: string, owner: string, pageNumber = 1) {
    const orgMembers: User[] = await OCTOKIT.rest.orgs
      .listMembers({
        org: owner,
        page: 1,
        per_page: 100,
      })
      .then((res) => res.data);

    updateArray(this.orgModel, id, { members: orgMembers });

    if (orgMembers.length == 100) {
      this.orgaMembers(id, owner, pageNumber + 1);
    }

    return orgMembers;
  }
}
