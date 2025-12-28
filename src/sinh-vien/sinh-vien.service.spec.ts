import { Test, TestingModule } from '@nestjs/testing';
import { SinhVienService } from './sinh-vien.service';

describe('SinhVienService', () => {
  let service: SinhVienService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SinhVienService],
    }).compile();

    service = module.get<SinhVienService>(SinhVienService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
