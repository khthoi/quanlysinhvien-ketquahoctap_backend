import { Module } from '@nestjs/common';
import { KetQuaHocTap } from './entity/ket-qua-hoc-tap.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SinhVienLopHocPhan } from 'src/giang-day/entity/sinhvien-lophocphan.entity';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KetQuaHocTap, SinhVienLopHocPhan, LopHocPhan, NguoiDung])],
  controllers: [],
  providers: [],
})
export class KetQuaModule {}
