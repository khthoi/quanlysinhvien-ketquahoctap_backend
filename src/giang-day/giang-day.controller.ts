import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { GiangDayService } from './giang-day.service';
import { CreateLopHocPhanDto } from './dtos/create-lop-hoc-phan.dto';
import { UpdateLopHocPhanDto } from './dtos/update-lop-hoc-phan.dto';
import { GetLopHocPhanQueryDto } from './dtos/get-lop-hoc-phan-query.dto';
import { GetSinhVienTrongLopQueryDto } from './dtos/get-sinh-vien-trong-lop-query.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { VaiTroNguoiDungEnum } from 'src/auth/enums/vai-tro-nguoi-dung.enum';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { GetPhanCongQueryDto } from './dtos/get-phan-cong-query.dto';
import { PaginationQueryDto } from './dtos/pagination-query.dto';
import { GetMyLopHocPhanQueryDto } from './dtos/get-my-lop-hoc-phan-query.dto';

@Controller('giang-day')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GiangDayController {
  constructor(private readonly giangDayService: GiangDayService) { }

  // ==================== LỚP HỌC PHẦN (Cán bộ ĐT) ====================

  @Post('lop-hoc-phan')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async create(@Body() dto: CreateLopHocPhanDto) {
    return this.giangDayService.create(dto);
  }

  @Get('lop-hoc-phan')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async findAll(@Query() query: GetLopHocPhanQueryDto) {
    return this.giangDayService.findAll(query);
  }

  @Get('lop-hoc-phan/:id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.giangDayService.findOne(id);
  }

  @Put('lop-hoc-phan/:id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLopHocPhanDto) {
    return this.giangDayService.update(id, dto);
  }

  @Delete('lop-hoc-phan/:id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.giangDayService.delete(id);
  }

  // Đăng ký SV vào lớp học phần
  @Post('lop-hoc-phan/:lop_hoc_phan_id/sinh-vien-dang-ky/:sinh_vien_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.CREATED) // 201 Created
  async dangKySinhVien(
    @Param('lop_hoc_phan_id', ParseIntPipe) lopHocPhanId: number,
    @Param('sinh_vien_id', ParseIntPipe) sinhVienId: number,
  ) {
    const result = await this.giangDayService.dangKySinhVien(lopHocPhanId, sinhVienId);
    return {
      message: 'Đăng ký sinh viên vào lớp học phần thành công',
      data: result,
    };
  }

  // Xóa SV khỏi lớp học phần
  @Delete('lop-hoc-phan/:lop_hoc_phan_id/sinh-vien-dang-ky/:sinh_vien_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async xoaSinhVienKhoiLop(
    @Param('lop_hoc_phan_id', ParseIntPipe) lopHocPhanId: number,
    @Param('sinh_vien_id', ParseIntPipe) sinhVienId: number,
  ): Promise<void> {
    await this.giangDayService.xoaSinhVienKhoiLop(lopHocPhanId, sinhVienId);
  }

  // Lấy danh sách SV trong 1 lớp học phần
  @Get('lop-hoc-phan/danh-sach-sinh-vien/:lop_hoc_phan_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getDanhSachSinhVien(
    @Param('lop_hoc_phan_id', ParseIntPipe) lopHocPhanId: number,
    @Query() query: GetSinhVienTrongLopQueryDto,
  ) {
    return this.giangDayService.getDanhSachSinhVien(lopHocPhanId, query);
  }

  // ==================== GIẢNG VIÊN XEM LỚP PHÂN CÔNG ====================

  @Get('lop-hoc-phan/giang-vien/me')
  @Roles(VaiTroNguoiDungEnum.GIANG_VIEN, VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getLopHocPhanCuaToi(
    @GetUser('userId') userId: number,
    @Query() query: GetMyLopHocPhanQueryDto,
  ) {
    return this.giangDayService.getLopHocPhanCuaGiangVien(userId, query);
  }

  // Phân công / Thay đổi giảng viên cho lớp học phần
  @Patch('phan-cong/giang-vien/:giang_vien_id/lop-hoc-phan/:lop_hoc_phan_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async phanCongHoacThayDoi(
    @Param('lop_hoc_phan_id', ParseIntPipe) lopHocPhanId: number,
    @Param('giang_vien_id', ParseIntPipe) giangVienId: number,
  ) {
    return this.giangDayService.phanCongGiangVien(lopHocPhanId, giangVienId);
  }

  // Hủy phân công
  @Delete('phan-cong/giang-vien/:giang_vien_id/lop-hoc-phan/:lop_hoc_phan_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async huyPhanCong(
    @Param('lop_hoc_phan_id', ParseIntPipe) lopHocPhanId: number,
  ): Promise<void> {
    await this.giangDayService.huyPhanCongGiangVien(lopHocPhanId);
  }

  // DS phân công (đã dùng GetPhanCongQueryDto có phân trang)
  @Get('phan-cong')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getDanhSachPhanCong(@Query() query: GetPhanCongQueryDto) {
    return this.giangDayService.getDanhSachPhanCong(query);
  }

  // Lịch phân công của 1 giảng viên – thêm query phân trang
  @Get('giang-vien/:giang_vien_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getLichPhanCongGV(
    @Param('giang_vien_id', ParseIntPipe) giangVienId: number,
    @Query() query: GetMyLopHocPhanQueryDto,
  ) {
    return this.giangDayService.getLopHocPhanCuaGiangVien(giangVienId, query);
  }
}