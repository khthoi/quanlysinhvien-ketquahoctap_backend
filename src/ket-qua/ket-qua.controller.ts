import { Controller } from '@nestjs/common';
import { KetQuaService } from './ket-qua.service';

@Controller('ket-qua')
export class KetQuaController {
  constructor(private readonly ketQuaService: KetQuaService) {}
}
