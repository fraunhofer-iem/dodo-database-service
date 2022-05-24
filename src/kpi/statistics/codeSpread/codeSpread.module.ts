import { Module } from '@nestjs/common';
import { CodeSpreadService } from './codeSpread.service';

@Module({
  providers: [CodeSpreadService],
  imports: [],
  exports: [CodeSpreadService],
})
export class CodeSpreadModule {}
