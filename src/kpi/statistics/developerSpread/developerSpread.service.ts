import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../../../entities/users/user.service';
import { CommitService } from '../../../entities/commits/commit.service';

@Injectable()
export class DeveloperSpreadService {
  private readonly logger = new Logger(DeveloperSpreadService.name);

  constructor(
    private readonly userService: UserService,
    private readonly commitService: CommitService,
  ) {}

  async developerSpread() {}
}
