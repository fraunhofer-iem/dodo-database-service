import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { DodoUser } from './model';
import { DodoUserService } from './dodoUser.service';

@Controller('api/users')
export class DodoUserController {
  private readonly logger = new Logger(DodoUserController.name);

  constructor(private userService: DodoUserService) {}

  @Post()
  async createUser(@Body() user: DodoUser) {
    return this.userService.readOrCreate({ ...user, targets: [] });
  }

  @Put()
  async updateUser(@Body() user: DodoUser) {
    const currentUser = await this.userService.read({ email: user.email });
    currentUser.targets = user.targets;
    await currentUser.save();
    return currentUser;
  }

  /*
   * In the future, this endpoint should be protected.
   * Only users with the corresponding role should be able to see other users than themselves
   */
  @Get()
  async users() {
    return this.userService.readAll();
  }

  @Get(':email')
  async user(@Param('email') email: string) {
    try {
      const user = await this.userService.read({ email: email });
      return user;
    } catch (err) {
      return 'No such user';
    }
  }
}
