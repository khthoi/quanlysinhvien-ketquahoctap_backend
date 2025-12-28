import { Test, TestingModule } from '@nestjs/testing';
import { DanhMucController } from './danh-muc.controller';
import { DanhMucService } from './danh-muc.service';

describe('DanhMucController', () => {
  let controller: DanhMucController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DanhMucController],
      providers: [DanhMucService],
    }).compile();

    controller = module.get<DanhMucController>(DanhMucController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
