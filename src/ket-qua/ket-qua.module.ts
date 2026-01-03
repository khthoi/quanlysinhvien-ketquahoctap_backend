import { Module } from '@nestjs/common';
import { KetQuaService } from './ket-qua.service';
import { KetQuaHocTap } from './entity/ket-qua-hoc-tap.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KetQuaController } from './ket-qua.controller';
import { SinhVienLopHocPhan } from 'src/giang-day/entity/sinhvien-lophocphan.entity';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KetQuaHocTap, SinhVienLopHocPhan, LopHocPhan, NguoiDung])],
  controllers: [KetQuaController],
  providers: [KetQuaService],
})
export class KetQuaModule {}
