import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationSchema } from './model/schemas';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Organization', schema: OrganizationSchema },
    ]),
  ],
  providers: [OrganizationService],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
