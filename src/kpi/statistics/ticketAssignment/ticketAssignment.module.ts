import { Module } from '@nestjs/common';
import { IssueModule } from 'src/entities/issues/issue.module';
import { TicketAssignmentService } from './ticketAssignment.service';

@Module({
  providers: [TicketAssignmentService],
  imports: [IssueModule],
  exports: [TicketAssignmentService],
  controllers: [],
})
export class TicketAssignmentModule {}
