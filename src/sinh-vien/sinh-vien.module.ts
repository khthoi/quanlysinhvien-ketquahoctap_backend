import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SinhVien } from './entity/sinh-vien.entity';
import { KhenThuongKyLuat } from './entity/khenthuong-kyluat.entity';
import { Lop } from 'src/danh-muc/entity/lop.entity';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';
import { SinhVienLopHocPhan } from 'src/giang-day/entity/sinhvien-lophocphan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SinhVien, KhenThuongKyLuat, Lop, NguoiDung, SinhVienLopHocPhan])],
  controllers: [],
  providers: [],
})
export class SinhVienModule {}
