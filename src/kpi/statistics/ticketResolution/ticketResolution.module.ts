import { Module } from '@nestjs/common';
import { IssueModule } from 'src/entities/issues/issue.module';
import { TicketResolutionService } from './ticketResolution.service';

@Module({
  providers: [TicketResolutionService],
  imports: [IssueModule],
  exports: [TicketResolutionService],
  controllers: [],
})
export class TicketResolutionModule {}
