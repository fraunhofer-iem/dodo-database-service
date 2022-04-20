import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KpiModule } from 'src/kpi/kpi.module';
import { RepositoryModule } from '../repositories/repository.module';
import { Organization, OrganizationSchema } from './model/schemas';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Organization.name, schema: OrganizationSchema }],
      'data',
    ),
    RepositoryModule,
    KpiModule,
  ],
  providers: [OrganizationService],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
