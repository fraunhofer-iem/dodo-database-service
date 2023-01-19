import { Module } from '@nestjs/common';
import { DiffFileModule } from 'src/entities/diffFiles/diffFile.module';
import { CommitModule } from '../../../entities/commits/commit.module';
import { FileSeparationService } from './fileSeparation.service';

@Module({
  providers: [FileSeparationService],
  imports: [CommitModule, DiffFileModule],
  exports: [FileSeparationService],
})
export class FileSeparationModule {}
