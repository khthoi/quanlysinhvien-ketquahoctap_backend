import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DanhMucModule } from './danh-muc/danh-muc.module';
import { SinhVienModule } from './sinh-vien/sinh-vien.module';
import { DaoTaoModule } from './dao-tao/dao-tao.module';
import { GiangDayModule } from './giang-day/giang-day.module';
import { KetQuaModule } from './ket-qua/ket-qua.module';
import { BaoCaoModule } from './bao-cao/bao-cao.module';

@Module({
  imports: [AuthModule, DanhMucModule, SinhVienModule, DaoTaoModule, GiangDayModule, KetQuaModule, BaoCaoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
