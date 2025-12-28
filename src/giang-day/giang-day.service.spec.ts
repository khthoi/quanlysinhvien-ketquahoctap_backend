import { Test, TestingModule } from '@nestjs/testing';
import { GiangDayService } from './giang-day.service';

describe('GiangDayService', () => {
  let service: GiangDayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GiangDayService],
    }).compile();

    service = module.get<GiangDayService>(GiangDayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
