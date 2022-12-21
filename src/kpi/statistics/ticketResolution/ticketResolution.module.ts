import { Module } from '@nestjs/common';
import { IssueModule } from 'src/entities/issues/issue.module';
import { ReleaseCycleModule } from '../releaseCycles/releaseCycle.module';
import { TicketResolutionService } from './ticketResolution.service';

@Module({
  providers: [TicketResolutionService],
  imports: [IssueModule, ReleaseCycleModule],
  exports: [TicketResolutionService],
  controllers: [],
})
export class TicketResolutionModule {}
