import { Controller } from '@nestjs/common';
import { GiangDayService } from './giang-day.service';

@Controller('giang-day')
export class GiangDayController {
  constructor(private readonly giangDayService: GiangDayService) {}
}
