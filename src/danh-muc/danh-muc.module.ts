import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DanhMucService } from './danh-muc.service';
import { GiangVien } from './entity/giang-vien.entity';
import { Khoa } from './entity/khoa.entity';
import { Lop } from './entity/lop.entity';
import { MonHoc } from './entity/mon-hoc.entity';
import { Nganh } from './entity/nganh.entity';
import { NienKhoa } from './entity/nien-khoa.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DanhMucController } from './danh-muc.controller';
import { GiangVienMonHoc } from './entity/giangvien-monhoc.entity';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';
import { DebugDanhMucMiddleware } from 'src/common/middleware/debug-danh-muc.middleware';
import { YeuCauHocPhan } from 'src/giang-day/entity/yeu-cau-hoc-phan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GiangVien, Khoa, Lop, MonHoc, Nganh, NienKhoa, GiangVienMonHoc, NguoiDung, YeuCauHocPhan])],
  controllers: [DanhMucController],
  providers: [DanhMucService],
})
// export class DanhMucModule implements NestModule {
// configure(consumer: MiddlewareConsumer) {
// consumer
// .apply(DebugDanhMucMiddleware)
// .forRoutes('danh-muc'); // 👈 QUAN TRỌNG
// }
// }
export class DanhMucModule { }

