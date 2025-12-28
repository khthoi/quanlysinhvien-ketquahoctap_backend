import { Module } from '@nestjs/common';
import { DaoTaoService } from './dao-tao.service';
import { DaoTaoController } from './dao-tao.controller';

@Module({
  controllers: [DaoTaoController],
  providers: [DaoTaoService],
})
export class DaoTaoModule {}
