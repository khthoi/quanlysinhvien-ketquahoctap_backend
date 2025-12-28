import { Module } from '@nestjs/common';
import { SinhVienService } from './sinh-vien.service';
import { SinhVienController } from './sinh-vien.controller';

@Module({
  controllers: [SinhVienController],
  providers: [SinhVienService],
})
export class SinhVienModule {}
