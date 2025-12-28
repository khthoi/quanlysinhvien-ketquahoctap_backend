import { Test, TestingModule } from '@nestjs/testing';
import { DanhMucService } from './danh-muc.service';

describe('DanhMucService', () => {
  let service: DanhMucService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DanhMucService],
    }).compile();

    service = module.get<DanhMucService>(DanhMucService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
