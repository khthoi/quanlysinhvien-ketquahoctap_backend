import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SinhVienService } from './sinh-vien.service';
import { CreateSinhVienDto } from './dtos/create-sinh-vien.dto';
import { UpdateSinhVienDto } from './dtos/update-sinh-vien.dto';
import { GetSinhVienQueryDto } from './dtos/get-sinh-vien-query.dto';
import { KhenThuongKyLuatDto } from './dtos/khen-thuong-ky-luat.dto';
import { PhanLopDto } from './dtos/phan-lop.dto';
import { ThayDoiTinhTrangDto } from './dtos/thay-doi-tinh-trang.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { VaiTroNguoiDungEnum } from 'src/auth/enums/vai-tro-nguoi-dung.enum';
import { GetLichHocMeQueryDto } from './dtos/get-lich-hoc-me-query.dto';

@Controller('sinh-vien')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SinhVienController {
  constructor(private readonly sinhVienService: SinhVienService) { }

  @Post()
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async create(@Body() dto: CreateSinhVienDto) {
    return this.sinhVienService.create(dto);
  }

  @Get()
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async findAll(@Query() query: GetSinhVienQueryDto) {
    return this.sinhVienService.findAll(query);
  }

  @Get(':id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sinhVienService.findOne(id);
  }

  // GET /sinh-vien/me/my-profile - sinh viên xem thông tin cá nhân của mình
  @Get('me/my-profile')
  @Roles(VaiTroNguoiDungEnum.SINH_VIEN)  // Chỉ sinh viên mới được gọi
  async getMe(@GetUser('userId') userId: number) {
    return this.sinhVienService.findMe(userId);
  }

  @Put(':id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSinhVienDto) {
    return this.sinhVienService.update(id, dto);
  }

  @Patch('tinh-trang/:sinhvien_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async thayDoiTinhTrang(
    @Param('sinhvien_id', ParseIntPipe) sinhvien_id: number,
    @Body() dto: ThayDoiTinhTrangDto,
  ) {
    return this.sinhVienService.thayDoiTinhTrang(sinhvien_id, dto);
  }

  @Patch('phan-lop/:sinhvien_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async phanLop(
    @Param('sinhvien_id', ParseIntPipe) sinhvien_id: number,
    @Body() dto: PhanLopDto,
  ) {
    return this.sinhVienService.phanLop(sinhvien_id, dto);
  }

  @Post('khen-thuong/:sinhvien_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async themKhenThuong(
    @Param('sinhvien_id', ParseIntPipe) sinhvien_id: number,
    @Body() dto: KhenThuongKyLuatDto,
  ) {
    return this.sinhVienService.themKhenThuongKyLuat(sinhvien_id, dto);
  }

  @Delete('khen-thuong/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async xoaKhenThuong(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.sinhVienService.xoaKhenThuongKyLuat(id);
  }

  @Post('ky-luat/:sinhvien_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async themKyLuat(
    @Param('sinhvien_id', ParseIntPipe) sinhvien_id: number,
    @Body() dto: KhenThuongKyLuatDto,
  ) {
    return this.sinhVienService.themKhenThuongKyLuat(sinhvien_id, dto);
  }

  @Delete('ky-luat/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async xoaKyLuat(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.sinhVienService.xoaKhenThuongKyLuat(id);
  }

  @Get('thanh-tich/:sinhvien_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getThanhTich(@Param('sinhvien_id', ParseIntPipe) sinhvien_id: number) {
    return this.sinhVienService.getThanhTich(sinhvien_id);
  }

  // API lịch học của sinh viên hiện tại - có phân trang và lọc học kỳ
  @Get('lich-hoc/me')
  @Roles(VaiTroNguoiDungEnum.SINH_VIEN)
  async getLichHocMe(
    @GetUser('userId') userId: number,
    @Query() query: GetLichHocMeQueryDto,
  ) {
    return this.sinhVienService.getLichHocMe(userId, query);
  }
}