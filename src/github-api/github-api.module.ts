import { Module } from '@nestjs/common';
import { GithubApiService } from './github-api.service';
import { GithubApiController } from './github-api.controller';
import { DatabaseModule } from 'src/database/database.module';
import { ValidationService } from './validation.service';

@Module({
  providers: [ValidationService, GithubApiService],
  imports: [DatabaseModule],
  controllers: [GithubApiController],
})
export class GithubApiModule {}