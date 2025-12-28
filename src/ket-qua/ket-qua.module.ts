import { Module } from '@nestjs/common';
import { KetQuaService } from './ket-qua.service';
import { KetQuaHocTap } from './entity/ket-qua-hoc-tap.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KetQuaController } from './ket-qua.controller';

@Module({
  imports: [TypeOrmModule.forFeature([KetQuaHocTap])],
  controllers: [KetQuaController],
  providers: [KetQuaService],
})
export class KetQuaModule {}
