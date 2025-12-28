import { Controller } from '@nestjs/common';
import { DanhMucService } from './danh-muc.service';

@Controller('danh-muc')
export class DanhMucController {
  constructor(private readonly danhMucService: DanhMucService) {}
}
