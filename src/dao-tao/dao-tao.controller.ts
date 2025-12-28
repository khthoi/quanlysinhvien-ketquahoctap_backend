import { Controller } from '@nestjs/common';
import { DaoTaoService } from './dao-tao.service';

@Controller('dao-tao')
export class DaoTaoController {
  constructor(private readonly daoTaoService: DaoTaoService) {}
}
