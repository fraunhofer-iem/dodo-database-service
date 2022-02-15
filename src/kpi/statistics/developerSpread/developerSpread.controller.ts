import { Controller, Get, Logger } from '@nestjs/common';
import { DeveloperSpreadService } from './developerSpread.service';

@Controller('api/devSpread')
export class DeveloperSpreadController {
  private readonly logger = new Logger(DeveloperSpreadController.name);

  constructor(private devSpreadService: DeveloperSpreadService) {}

  @Get()
  async getDevSpread() {
    this.logger.log('Calculating devSpread');
    this.devSpreadService.developerSpread();
  }
}
