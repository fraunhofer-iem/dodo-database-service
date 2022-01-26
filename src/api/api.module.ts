import { Module } from '@nestjs/common';
import { KpiController } from './kpi/kpi.controller';
import { OrganizationController } from './organization/organization.controller';
import { RepositoryController } from './repository/repository.controller';

@Module({
  providers: [],
  controllers: [OrganizationController, RepositoryController, KpiController],
})
export class ApiModule {}
