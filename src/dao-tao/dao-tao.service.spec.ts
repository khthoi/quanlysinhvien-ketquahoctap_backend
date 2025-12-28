import { Test, TestingModule } from '@nestjs/testing';
import { DaoTaoService } from './dao-tao.service';

describe('DaoTaoService', () => {
  let service: DaoTaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DaoTaoService],
    }).compile();

    service = module.get<DaoTaoService>(DaoTaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
