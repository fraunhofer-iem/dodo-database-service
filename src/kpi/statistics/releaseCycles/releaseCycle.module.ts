import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { ReleaseCycleService } from './releaseCycle.service';

@Module({
  providers: [ReleaseCycleService],
  imports: [RepositoryModule],
  exports: [ReleaseCycleService],
  controllers: [],
})
export class ReleaseCycleModule {}
