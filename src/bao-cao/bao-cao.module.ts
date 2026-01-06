import { Module } from '@nestjs/common';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { KetQuaHocTap } from 'src/ket-qua/entity/ket-qua-hoc-tap.entity';
import { SinhVienLopHocPhan } from 'src/giang-day/entity/sinhvien-lophocphan.entity';
import { GiangVien } from 'src/danh-muc/entity/giang-vien.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LopHocPhan,
      SinhVien,
      KetQuaHocTap,
      GiangVien,
      SinhVienLopHocPhan,
    ]),
  ],
  controllers: [],
  providers: [],
})
export class BaoCaoModule {}
