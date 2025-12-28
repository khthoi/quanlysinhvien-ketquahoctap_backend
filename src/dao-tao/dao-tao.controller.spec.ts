import { Test, TestingModule } from '@nestjs/testing';
import { DaoTaoController } from './dao-tao.controller';
import { DaoTaoService } from './dao-tao.service';

describe('DaoTaoController', () => {
  let controller: DaoTaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DaoTaoController],
      providers: [DaoTaoService],
    }).compile();

    controller = module.get<DaoTaoController>(DaoTaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
