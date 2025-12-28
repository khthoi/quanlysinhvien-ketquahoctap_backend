import { Controller } from '@nestjs/common';
import { SinhVienService } from './sinh-vien.service';

@Controller('sinh-vien')
export class SinhVienController {
  constructor(private readonly sinhVienService: SinhVienService) {}
}
