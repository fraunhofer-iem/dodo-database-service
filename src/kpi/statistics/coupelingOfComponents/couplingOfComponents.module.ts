import { Module } from '@nestjs/common';
import { RepositoryModule } from 'src/entities/repositories/repository.module';
import { CouplingOfComponents } from './couplingOfComponents.service';

@Module({
  providers: [CouplingOfComponents],
  imports: [RepositoryModule],
  exports: [CouplingOfComponents],
  controllers: [],
})
export class CouplingOfComponentsModule {}
