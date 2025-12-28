import { Test, TestingModule } from '@nestjs/testing';
import { KetQuaService } from './ket-qua.service';

describe('KetQuaService', () => {
  let service: KetQuaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KetQuaService],
    }).compile();

    service = module.get<KetQuaService>(KetQuaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
