import { Module } from '@nestjs/common';
import { GithubApiService } from './github-api.service';
import { GithubApiController } from './github-api.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  providers: [GithubApiService],
  imports: [DatabaseModule],
  controllers: [GithubApiController],
})
export class GithubApiModule {}
