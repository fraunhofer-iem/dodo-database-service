import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositorySchema } from '../model/schemas';
import { ReleaseSchema } from './model/schemas';

import { ReleaseService } from './release.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Releases', schema: ReleaseSchema },
      { name: 'Repository', schema: RepositorySchema },
    ]),
  ],
  providers: [ReleaseService],
})
export class ReleaseModule {}
