import { Module } from '@nestjs/common';
import { KetQuaService } from './ket-qua.service';
import { KetQuaController } from './ket-qua.controller';

@Module({
  controllers: [KetQuaController],
  providers: [KetQuaService],
})
export class KetQuaModule {}
