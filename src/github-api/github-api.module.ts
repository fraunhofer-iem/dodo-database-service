import { Module } from '@nestjs/common';
import { GithubApiService } from './github-api.service';
import { GithubApiController } from './github-api.controller';
import { DatabaseService } from 'src/database/database.service';

@Module({
  providers: [GithubApiService],
  imports: [DatabaseService],
  controllers: [GithubApiController],
})
export class GithubApiModule {}
