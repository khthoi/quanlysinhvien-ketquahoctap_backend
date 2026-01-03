import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { KetQuaService } from './ket-qua.service';
import { NhapDiemDto } from './dtos/nhap-diem.dto';
import { GetKetQuaLopQueryDto } from './dtos/get-ket-qua-lop-query.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { VaiTroNguoiDungEnum } from 'src/auth/enums/vai-tro-nguoi-dung.enum';

@Controller('ket-qua')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KetQuaController {
  constructor(private readonly ketQuaService: KetQuaService) {}

  // Nhập điểm
  @Post('nhap-diem')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO, VaiTroNguoiDungEnum.GIANG_VIEN)
  async nhapDiem(
    @Body() dto: NhapDiemDto & { lopHocPhanId: number; sinhVienId: number },
  ) {
    return this.ketQuaService.nhapDiem(dto.lopHocPhanId, dto.sinhVienId, dto);
  }

  // Sửa điểm
  @Put(':id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async suaDiem(@Param('id', ParseIntPipe) id: number, @Body() dto: NhapDiemDto) {
    return this.ketQuaService.suaDiem(id, dto);
  }

  // DS điểm của lớp học phần
  @Get('lop-hoc-phan/:lop_hoc_phan_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getDanhSachDiemLop(
    @Param('lop_hoc_phan_id', ParseIntPipe) lopHocPhanId: number,
    @Query() query: GetKetQuaLopQueryDto,
  ) {
    return this.ketQuaService.getDanhSachDiemLop(lopHocPhanId, query);
  }

  // Sinh viên xem kết quả của mình
  @Get('sinh-vien/me')
  @Roles(VaiTroNguoiDungEnum.SINH_VIEN)
  async getKetQuaCuaToi(@GetUser('userId') userId: number) {
    return this.ketQuaService.getKetQuaCuaToi(userId);
  }
}