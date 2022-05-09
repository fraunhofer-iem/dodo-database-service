import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiffFile, DiffFileSchema } from './model/schemas';
import { DiffFileService } from './diffFile.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: DiffFile.name, schema: DiffFileSchema }],
      'data',
    ),
  ],
  providers: [DiffFileService],
  exports: [DiffFileService],
})
export class DiffFileModule {}
