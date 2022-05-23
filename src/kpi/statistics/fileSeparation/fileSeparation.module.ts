import { Module } from '@nestjs/common';
import { CommitModule } from 'src/entities/commits/commit.module';
import { FileSeparationService } from './fileSeparation.service';

@Module({
  providers: [FileSeparationService],
  imports: [CommitModule],
  exports: [FileSeparationService],
})
export class FileSeparationModule {}
