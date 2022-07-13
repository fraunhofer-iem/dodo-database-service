import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { PrCommentsService } from './prComments.service';

@Module({
  providers: [PrCommentsService],
  imports: [RepositoryModule],
  exports: [PrCommentsService],
  controllers: [],
})
export class PrCommentsModule {}
