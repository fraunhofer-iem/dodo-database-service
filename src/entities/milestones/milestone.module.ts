import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../users/user.module';
import { UserService } from '../users/user.service';
import { MilestoneService } from './milestone.service';
import { Milestone, MilestoneSchema } from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeatureAsync(
      [
        {
          name: Milestone.name,
          imports: [UserModule],
          useFactory: (userService: UserService) => {
            return MilestoneSchema.pre<Milestone>(
              'validate',
              async function (this: Milestone) {
                this.creator = (
                  await userService.readOrCreate(this.creator)
                )._id;
              },
            );
          },
          inject: [UserService],
        },
      ],
      'data',
    ),
  ],
  providers: [MilestoneService],
  exports: [MilestoneService],
})
export class MilestoneModule {}
