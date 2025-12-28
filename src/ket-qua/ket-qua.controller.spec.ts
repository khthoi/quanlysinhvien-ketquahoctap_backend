import { Test, TestingModule } from '@nestjs/testing';
import { KetQuaController } from './ket-qua.controller';
import { KetQuaService } from './ket-qua.service';

describe('KetQuaController', () => {
  let controller: KetQuaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KetQuaController],
      providers: [KetQuaService],
    }).compile();

    controller = module.get<KetQuaController>(KetQuaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
