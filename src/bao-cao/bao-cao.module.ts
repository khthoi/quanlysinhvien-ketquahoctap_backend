import { Module } from '@nestjs/common';
import { BaoCaoService } from './bao-cao.service';
import { BaoCaoController } from './bao-cao.controller';

@Module({
  controllers: [BaoCaoController],
  providers: [BaoCaoService],
})
export class BaoCaoModule {}
