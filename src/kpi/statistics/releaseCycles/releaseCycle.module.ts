import { Module } from '@nestjs/common';
import { RepositoryModule } from 'src/entities/repositories/repository.module';
import { ReleaseCycle } from './releaseCycle.service';

@Module({
  providers: [ReleaseCycle],
  imports: [RepositoryModule],
  exports: [ReleaseCycle],
  controllers: [],
})
export class ReleaseCycleModule {}
