import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RepositoryService } from '../repositories/repository.service';
import { updateArray, documentExists } from '../../lib';
import { User } from '../users/model';
import { Organization, OrganizationDocument } from './model/schemas';
import { queryMembers, queryRepos } from './lib';
import { KpiService } from 'src/kpi/kpi.service';
import { Intervals } from 'src/kpi/statistics/lib';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    @InjectModel(Organization.name)
    private readonly orgModel: Model<OrganizationDocument>,
    private repoService: RepositoryService,
    private kpiService: KpiService,
  ) {}

  public async initializeOrga(owner: string, repoNames?: string[]) {
    this.logger.log(`creating org for ${owner}`);
    const { _id: id } = await this.getOrg(owner);
    // TODO: this can be done in parallel and there should be no awaits
    // necessary. will keep them for now for better testability and
    // more stability in local runs.
    // await this.addRepos(owner, id, repoNames);
    await this.addOrgaMembers(id, owner);
  }

  public async getRepos(
    owner: string,
    since?: string,
    to?: string,
    repos: string[] = [],
  ) {
    const pipeline = this.repoService.preAggregate({ owner: owner }, {});
    console.log(repos);
    pipeline.addFields({
      id: { $concat: ['$owner', '/', '$repo'] },
      name: '$repo',
      health: 0,
    });
    if (repos.length) {
      pipeline.match({
        repo: {
          $in: repos,
        },
      });
    }
    pipeline.project({
      _id: 0,
      __v: 0,
      repo: 0,
    });
    pipeline.group({
      _id: '$owner',
      repos: { $push: '$$ROOT' },
    });

    const result = await pipeline.exec();
    if (result.length) {
      for (const repo of result[0].repos) {
        const health = await this.kpiService.getKpi({
          id: 'repoHealth',
          owner: repo.owner,
          repo: repo.name,
          since:
            since ??
            new Date(
              new Date().getUTCFullYear(),
              new Date().getUTCMonth() - 3,
              new Date().getUTCDate(),
            )
              .toISOString()
              .split('T')[0],
          to: to ?? new Date().toISOString().split('T')[0],
          interval: Intervals.MONTH,
        });
        repo.health = (health as any).value;
      }
      return result[0].repos;
    }
    return [];
  }

  public async getKpis(
    owner: string,
    since?: string,
    to?: string,
    repoNames?: string[],
    kpiIds?: string[],
    includeData?: boolean,
  ) {
    const repos = await this.getRepos(owner, since, to, repoNames);

    const kpiConfig: { id: string; params: { [key: string]: any } }[] = [
      { id: 'mttr', params: { interval: Intervals.WEEK } },
      { id: 'devSpread', params: { interval: Intervals.WEEK } },
      {
        id: 'coc',
        params: {
          interval: Intervals.WEEK,
          fileFilter: ['README.md', 'package.json', 'package-lock.json'],
          couplingSize: 3,
          occurences: 3,
        },
      },
      { id: 'releaseCycle', params: { interval: Intervals.WEEK } },
    ];
    if (repoNames.length) {
      kpiConfig.push({
        id: 'repoHealth',
        params: { interval: Intervals.MONTH, since: since, to: to },
      });
    }

    const kpis = [];
    for (const repo of repos) {
      for (const { id, params } of kpiConfig) {
        if (kpiIds.length && !kpiIds.includes(id)) {
          continue;
        }
        try {
          kpis.push(
            //@ts-ignore
            await this.kpiService.getKpi({
              id,
              owner,
              repo: repo.name,
              since:
                since ??
                new Date(
                  new Date().getUTCFullYear(),
                  new Date().getUTCMonth() - 3,
                  new Date().getUTCDate(),
                )
                  .toISOString()
                  .split('T')[0],
              to: to ?? new Date().toISOString().split('T')[0],
              includeData: includeData,
              ...params,
            }),
          );
        } catch {}
      }
    }
    return kpis;
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

  // private async addRepos(
  //   owner: string,
  //   id: string,
  //   repoNames?: string[],
  //   pageNumber = 1,
  // ) {
  //   const repos = await queryRepos(owner, pageNumber, repoNames);

  //   for (const repo of repos) {
  //     this.logger.log(`initializing repo ${repo.name}`);
  //     const currRepos = await this.repoService.initializeRepository({
  //       owner: owner,
  //       repo: repo.name,
  //     });
  //     updateArray(this.orgModel, id, { repositories: currRepos });
  //   }

  //   if (repos.length == 100) {
  //     this.addRepos(owner, id, repoNames, pageNumber + 1);
  //   }
  // }

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
