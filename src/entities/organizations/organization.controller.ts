import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateOrgDto } from './model';
import { OrganizationService } from './organization.service';

@Controller('api/organizations')
export class OrganizationController {
  private readonly logger = new Logger(OrganizationController.name);

  constructor(private orgService: OrganizationService) {}

  @Get()
  async getOrgs() {
    this.logger.log('Get all organizations request from user XXX');
  }

  @Post()
  async createOrg(@Body() createOrgDto: CreateOrgDto) {
    this.logger.log(
      `Creating entry for organization ${createOrgDto.identifier}`,
    );
    this.orgService.initializeOrga(createOrgDto.identifier);
  }

  @Get(':id')
  async getOrg(@Param('id') id: string) {
    this.logger.log(`Received query for org with id ${id}`);
  }

  @Get(':id/repositories')
  async getRepos(
    @Param('id') id: string,
    @Query('since') since?: string,
    @Query('to') to?: string,
  ) {
    this.logger.log(`Received query for repos of org ${id}`);
    return this.orgService.getRepos(id, since, to);
  }

  @Get(':id/kpis')
  async getKpis(
    @Param('id') id: string,
    @Query('since') since?: string,
    @Query('to') to?: string,
    @Query('repos') repos: string[] = [],
    @Query('kpis') kpis: string[] = [],
    @Query('data') data = false,
  ) {
    this.logger.log(`Received query for KPIs of repositories of org ${id}`);
    return this.orgService.getKpis(id, since, to, repos, kpis, data);
  }

  @Get(':id/trends')
  async getOrgTrend(@Param('id') id: string) {
    this.logger.log(`Received query for org trend with id ${id}`);
  }
}
