import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommitModule } from '../commits/commit.module';
import { IssueModule } from '../issues/issue.module';
import { Repository, RepositorySchema } from './model/schemas';
import { DiffModule } from '../diffs/diff.module';
import { ReleaseModule } from '../releases/release.module';
import { RepositoryController } from './repository.controller';
import { RepositoryService } from './repository.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Repository.name, schema: RepositorySchema }],
      'data',
    ),
    DiffModule,
    ReleaseModule,
    IssueModule,
    CommitModule,
  ],
  providers: [RepositoryService],
  controllers: [RepositoryController],
  exports: [RepositoryService],
})
export class RepositoryModule {}
