import { Test, TestingModule } from '@nestjs/testing';
import { SinhVienController } from './sinh-vien.controller';
import { SinhVienService } from './sinh-vien.service';

describe('SinhVienController', () => {
  let controller: SinhVienController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SinhVienController],
      providers: [SinhVienService],
    }).compile();

    controller = module.get<SinhVienController>(SinhVienController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
