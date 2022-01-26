import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositorySchema } from './model/schemas';
import { PullRequestModule } from './pullRequests/pullRequest.module';
import { ReleaseModule } from './releases/release.module';
import { RepositoryController } from './repository.controller';
import { RepositoryService } from './repository.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Repository', schema: RepositorySchema },
    ]),
    PullRequestModule,
    ReleaseModule,
  ],
  providers: [RepositoryService],
  controllers: [RepositoryController],
})
export class RepositoryModule {}
