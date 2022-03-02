import { Module } from '@nestjs/common';
import { RepositoryModule } from 'src/entities/repositories/repository.module';
import { CouplingOfComponentsService } from './couplingOfComponents.service';

@Module({
  providers: [CouplingOfComponentsService],
  imports: [RepositoryModule],
  exports: [CouplingOfComponentsService],
  controllers: [],
})
export class CouplingOfComponentsModule {}
