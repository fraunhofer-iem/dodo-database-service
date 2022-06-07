import { Module } from '@nestjs/common';
import { CommitModule } from '../../entities/commits/commit.module';
import { DiffModule } from '../../entities/diffs/diff.module';
import { IssueModule } from '../../entities/issues/issue.module';
import { ReleaseModule } from '../../entities/releases/release.module';
import { RepositoryModule } from '../../entities/repositories/repository.module';
import { RepositoryFileModule } from '../../entities/repositoryFiles/repositoryFile.module';
import { DodoUserModule } from '../users/dodoUser.module';
import { DataExtractionController } from './dataExtraction.controller';
import { DataExtractionService } from './dataExtraction.service';

@Module({
  imports: [
    DodoUserModule,
    RepositoryModule,
    IssueModule,
    CommitModule,
    ReleaseModule,
    RepositoryFileModule,
    DiffModule,
  ],
  providers: [DataExtractionService],
  controllers: [DataExtractionController],
})
export class DataExtractionModule {}
