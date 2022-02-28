import { Module } from '@nestjs/common';
import { RepositoryModule } from 'src/entities/repositories/repository.module';
import { MeanTimeToResolutionService } from './meanTimeToResolution.service';

@Module({
  providers: [MeanTimeToResolutionService],
  imports: [RepositoryModule],
  exports: [MeanTimeToResolutionService],
  controllers: [],
})
export class MeanTimeToResolutionModule {}
