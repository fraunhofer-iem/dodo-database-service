import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { CreateOrgDto } from './model';
import { OrganizationService } from './organization.service';

@Controller('api/organizations')
export class OrganizationController {
  private readonly logger = new Logger(OrganizationController.name);

  constructor(private orgaService: OrganizationService) {}

  @Get()
  async getOrgs() {
    this.logger.log('Get all organizations request from user XXX');
  }

  @Post()
  async createOrg(@Body() createOrgDto: CreateOrgDto) {
    this.logger.log(
      `Creating entry for organization ${createOrgDto.identifier}`,
    );
    this.orgaService.initializeOrga(createOrgDto.identifier);
  }

  @Get(':id')
  async getOrg(@Param('id') id: string) {
    this.logger.log(`Received query for org with id ${id}`);
  }

  @Get(':id/trends')
  async getOrgTrend(@Param('id') id: string) {
    this.logger.log(`Received query for org trend with id ${id}`);
  }
}
