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
} from '@nestjs/common';
import { DaoTaoService } from './dao-tao.service';
import { CreateNamHocDto } from './dtos/create-nam-hoc.dto';
import { UpdateNamHocDto } from './dtos/update-nam-hoc.dto';
import { CreateHocKyDto } from './dtos/create-hoc-ky.dto';
import { UpdateHocKyDto } from './dtos/update-hoc-ky.dto';
import { GetNamHocQueryDto } from './dtos/get-nam-hoc-query.dto';
import { GetHocKyQueryDto } from './dtos/get-hoc-ky-query.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { VaiTroNguoiDungEnum } from 'src/auth/enums/vai-tro-nguoi-dung.enum';
import { CreateApDungDto } from './dtos/create-ap-dung-dto';
import { CreateChuongTrinhDto } from './dtos/create-chuong-trinh-dto';
import { GetApDungQueryDto } from './dtos/get-ap-dung-query.dto';
import { GetChuongTrinhQueryDto } from './dtos/get-chuong-trinh-query.dto';
import { UpdateApDungDto } from './dtos/update-ap-dung-dto';
import { UpdateChuongTrinhDto } from './dtos/update-chuong-trinh-dto';
import { CreateChiTietMonHocDto } from './dtos/create-chi-tiet-mon-hoc.dto';
import { UpdateChiTietMonHocDto } from './dtos/update-chi-tiet-mon-hoc.dto';

@Controller('dao-tao')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
export class DaoTaoController {
  constructor(private readonly daoTaoService: DaoTaoService) { }

  // ==================== NĂM HỌC ====================

  @Get('nam-hoc')
  async getAllNamHoc(@Query() query: GetNamHocQueryDto) {
    return this.daoTaoService.getAllNamHoc(query);
  }

  @Post('nam-hoc')
  async createNamHoc(@Body() dto: CreateNamHocDto) {
    return this.daoTaoService.createNamHoc(dto);
  }

  @Put('nam-hoc/:id')
  async updateNamHoc(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNamHocDto,
  ) {
    return this.daoTaoService.updateNamHoc(id, dto);
  }

  @Delete('nam-hoc/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNamHoc(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.daoTaoService.deleteNamHoc(id);
  }

  // ==================== HỌC KỲ ====================

  @Get('hoc-ky')
  async getAllHocKy(@Query() query: GetHocKyQueryDto) {
    return this.daoTaoService.getAllHocKy(query);
  }

  @Post('hoc-ky')
  async createHocKy(@Body() dto: CreateHocKyDto) {
    return this.daoTaoService.createHocKy(dto);
  }

  @Put('hoc-ky/:id')
  async updateHocKy(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHocKyDto,
  ) {
    return this.daoTaoService.updateHocKy(id, dto);
  }

  @Delete('hoc-ky/:id')
  async deleteHocKy(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.daoTaoService.deleteHocKy(id);
  }

  // ==================== CHƯƠNG TRÌNH ĐÀO TẠO ====================

  @Post('chuong-trinh')
  async createChuongTrinh(@Body() dto: CreateChuongTrinhDto) {
    return this.daoTaoService.createChuongTrinh(dto);
  }

  @Get('chuong-trinh')
  async getAllChuongTrinh(@Query() query: GetChuongTrinhQueryDto) {
    return this.daoTaoService.getAllChuongTrinh(query);
  }

  @Get('chuong-trinh/:id')
  async getChuongTrinhById(@Param('id', ParseIntPipe) id: number) {
    return this.daoTaoService.getChuongTrinhById(id);
  }

  @Put('chuong-trinh/:id')
  async updateChuongTrinh(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateChuongTrinhDto) {
    return this.daoTaoService.updateChuongTrinh(id, dto);
  }

  @Delete('chuong-trinh/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChuongTrinh(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.daoTaoService.deleteChuongTrinh(id);
  }

  // ==================== ÁP DỤNG CHƯƠNG TRÌNH ====================

  @Post('ap-dung')
  async createApDung(@Body() dto: CreateApDungDto) {
    return this.daoTaoService.createApDung(dto);
  }

  @Get('ap-dung')
  async getAllApDung(@Query() query: GetApDungQueryDto) {
    return this.daoTaoService.getAllApDung(query);
  }

  @Get('ap-dung/:id')
  async getApDungById(@Param('id', ParseIntPipe) id: number) {
    return this.daoTaoService.getApDungById(id);
  }

  @Put('ap-dung/:id')
  async updateApDung(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateApDungDto) {
    return this.daoTaoService.updateApDung(id, dto);
  }

  @Delete('ap-dung/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteApDung(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.daoTaoService.deleteApDung(id);
  }

  // ==================== CHI TIẾT CHƯƠNG TRÌNH ĐÀO TẠO ====================

  @Post('chuong-trinh/mon-hoc/:chuong_trinh_id')
  async themMonHocVaoChuongTrinh(
    @Param('chuong_trinh_id', ParseIntPipe) chuongTrinhId: number,
    @Body() dto: CreateChiTietMonHocDto,
  ) {
    return this.daoTaoService.themMonHocVaoChuongTrinh(chuongTrinhId, dto);
  }

  @Put('chuong-trinh/chi-tiet/:chi_tiet_chuong_trinh_dt_id')
  async suaChiTietMonHoc(
    @Param('chi_tiet_chuong_trinh_dt_id', ParseIntPipe) id: number,
    @Body() dto: UpdateChiTietMonHocDto,
  ) {
    return this.daoTaoService.suaChiTietMonHoc(id, dto);
  }

  @Delete('chuong-trinh/chi-tiet/:chi_tiet_chuong_trinh_dt_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async xoaMonKhoiChuongTrinh(
    @Param('chi_tiet_chuong_trinh_dt_id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.daoTaoService.xoaMonKhoiChuongTrinh(id);
  }

  @Get('chuong-trinh/chi-tiet/:chi_tiet_chuong_trinh_dt_id')
  async getChiTietMonHoc(@Param('chi_tiet_chuong_trinh_dt_id', ParseIntPipe) id: number) {
    return this.daoTaoService.getChiTietMonHoc(id);
  }

  @Get('chuong-trinh/tat-ca-mon-hoc/:chuong_trinh_id')
  async getTatCaMonHocTrongChuongTrinh(
    @Param('chuong_trinh_id', ParseIntPipe) chuongTrinhId: number,
  ) {
    return this.daoTaoService.getTatCaMonHocTrongChuongTrinh(chuongTrinhId);
  }
}