import { Module } from '@nestjs/common';
import { DanhMucService } from './danh-muc.service';
import { GiangVien } from './entity/giang-vien.entity';
import { Khoa } from './entity/khoa.entity';
import { Lop } from './entity/lop.entity';
import { MonHoc } from './entity/mon-hoc.entity';
import { Nganh } from './entity/nganh.entity';
import { NienKhoa } from './entity/nien-khoa.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DanhMucController } from './danh-muc.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GiangVien, Khoa, Lop, MonHoc, Nganh, NienKhoa])],
  controllers: [DanhMucController],
  providers: [DanhMucService],
})
export class DanhMucModule {}
