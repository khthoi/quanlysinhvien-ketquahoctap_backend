import { Controller } from '@nestjs/common';
import { BaoCaoService } from './bao-cao.service';

@Controller('bao-cao')
export class BaoCaoController {
  constructor(private readonly baoCaoService: BaoCaoService) {}
}
