import { Test, TestingModule } from '@nestjs/testing';
import { GiangDayController } from './giang-day.controller';
import { GiangDayService } from './giang-day.service';

describe('GiangDayController', () => {
  let controller: GiangDayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GiangDayController],
      providers: [GiangDayService],
    }).compile();

    controller = module.get<GiangDayController>(GiangDayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
