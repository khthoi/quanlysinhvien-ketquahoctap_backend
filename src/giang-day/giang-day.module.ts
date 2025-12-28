import { Module } from '@nestjs/common';
import { GiangDayService } from './giang-day.service';
import { GiangDayController } from './giang-day.controller';

@Module({
  controllers: [GiangDayController],
  providers: [GiangDayService],
})
export class GiangDayModule {}
