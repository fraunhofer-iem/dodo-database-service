import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RepositoryFile,
  RepositoryFileSchema,
} from './model/schemas/repositoryFile.schema';
import { RepositoryFileService } from './repositoryFile.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RepositoryFile.name, schema: RepositoryFileSchema },
    ]),
  ],
  providers: [RepositoryFileService],
  exports: [RepositoryFileService],
})
export class RepositoryFileModule {}
