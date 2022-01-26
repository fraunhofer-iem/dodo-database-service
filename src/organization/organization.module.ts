import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';

@Module({
  providers: [],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
