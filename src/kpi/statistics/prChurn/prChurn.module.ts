import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { PrChurnService } from './prChurn.service';

@Module({
  providers: [PrChurnService],
  imports: [RepositoryModule],
  exports: [PrChurnService],
  controllers: [],
})
export class PrChurnModule {}
