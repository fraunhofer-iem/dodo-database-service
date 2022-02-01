import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositorySchema } from '../../../repositories/model/schemas';
import { FaultCorrectionService } from './faultCorrection.service';
import { IssueService } from './issue.service';

@Module({
  providers: [IssueService, FaultCorrectionService],
  imports: [
    MongooseModule.forFeature([
      { name: 'Repository', schema: RepositorySchema },
    ]),
  ],
  controllers: [],
})
export class IssueModule {}
