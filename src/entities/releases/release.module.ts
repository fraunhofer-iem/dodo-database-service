import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Release, ReleaseSchema } from './model/schemas';
import { ReleaseService } from './release.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Release.name, schema: ReleaseSchema }],
      'data',
    ),
  ],
  providers: [ReleaseService],
  exports: [ReleaseService],
})
export class ReleaseModule {}
