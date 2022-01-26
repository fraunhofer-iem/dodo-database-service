import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Repository', schema: RepositorySchema },
    ]),
    PullRequestModule,
    ReleaseModule,
  ],
  providers: [IssueService],
})
export class IssueModule {}
