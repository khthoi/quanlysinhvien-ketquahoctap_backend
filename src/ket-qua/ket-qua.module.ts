import { Module } from '@nestjs/common';
import { KetQuaService } from './ket-qua.service';
import { KetQuaHocTap } from './entity/ket-qua-hoc-tap.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KetQuaController } from './ket-qua.controller';
import { SinhVienLopHocPhan } from 'src/giang-day/entity/sinhvien-lophocphan.entity';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';
import { KhenThuongKyLuat } from 'src/sinh-vien/entity/khenthuong-kyluat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KetQuaHocTap, SinhVienLopHocPhan, LopHocPhan, NguoiDung, KhenThuongKyLuat])],
  controllers: [KetQuaController],
  providers: [KetQuaService],
})
export class KetQuaModule {}
