import { Module } from '@nestjs/common';
import { GiangDayService } from './giang-day.service';
import { PhanCongGiangDay } from './entity/phan-cong-giang-day.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiangDayController } from './giang-day.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PhanCongGiangDay])],
  controllers: [GiangDayController],
  providers: [GiangDayService],
})
export class GiangDayModule {}
