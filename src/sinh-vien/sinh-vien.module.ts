import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SinhVienService } from './sinh-vien.service';
import { SinhVien } from './entity/sinh-vien.entity';
import { KhenThuongKyLuat } from './entity/khenthuong-kyluat.entity';
import { SinhVienController } from './sinh-vien.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SinhVien, KhenThuongKyLuat])],
  controllers: [SinhVienController],
  providers: [SinhVienService],
})
export class SinhVienModule {}
