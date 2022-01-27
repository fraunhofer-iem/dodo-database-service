import { Injectable, Logger } from '@nestjs/common';
import { OCTOKIT } from '../lib';
import { User } from '../model';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  public async orgaMembers(owner: string) {
    const orgMembers: User[] = await OCTOKIT.rest.orgs
      .listMembers({
        org: owner,
      })
      .then((res) => res.data);

    //TODO: create org schema. save all repos and org members of an org to that schema

    return orgMembers;
  }
}
