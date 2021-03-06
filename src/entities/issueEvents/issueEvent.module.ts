import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../users/user.module';
import { UserService } from '../users/user.service';
import { IssueEventService } from './issueEvent.service';
import { IssueEvent, IssueEventSchema } from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: IssueEvent.name,
        imports: [UserModule],
        useFactory: (userService: UserService) => {
          return IssueEventSchema.pre<IssueEvent>(
            'validate',
            async function (this: IssueEvent) {
              if (this.actor) {
                this.actor = (await userService.readOrCreate(this.actor))._id;
              }
            },
          );
        },
        inject: [UserService],
      },
    ]),
  ],
  providers: [IssueEventService],
  exports: [IssueEventService],
})
export class IssueEventModule {}
