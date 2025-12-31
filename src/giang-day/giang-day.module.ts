import { Module } from '@nestjs/common';
import { GiangDayService } from './giang-day.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiangDayController } from './giang-day.controller';
import { LopHocPhan } from './entity/lop-hoc-phan.entity';
import { SinhVienLopHocPhan } from './entity/sinhvien-lophocphan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LopHocPhan, SinhVienLopHocPhan])],
  controllers: [GiangDayController],
  providers: [GiangDayService],
})
export class GiangDayModule {}
