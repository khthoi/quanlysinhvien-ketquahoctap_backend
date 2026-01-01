import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Put,
  HttpCode,
  HttpStatus,
  Delete,
  BadRequestException,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  DanhMucService,
} from './danh-muc.service';
import { CreateKhoaDto } from './dtos/tao-khoa.dto';
import { UpdateKhoaDto } from './dtos/cap-nhat-khoa.dto';
import { Khoa } from './entity/khoa.entity';
import { UpdateNganhDto } from './dtos/cap-nhat-nganh.dto';
import { CreateNganhDto } from './dtos/tao-nganh.dto';
import { Nganh } from './entity/nganh.entity';
import { UpdateLopDto } from './dtos/cap-nhat-lop-nien-che.dto';
import { CreateLopDto } from './dtos/tao-lop-nien-che.dto';
import { Lop } from './entity/lop.entity';
import { UpdateMonHocDto } from './dtos/cap-nhat-mon-hoc.dto';
import { CreateMonHocDto } from './dtos/tao-mon-hoc.dto';
import { MonHoc } from './entity/mon-hoc.entity';
import { UpdateGiangVienDto } from './dtos/cap-nhat-thong-tin-giang-vien.dto';
import { CreateGiangVienDto } from './dtos/them-giang-vien.dto';
import { GiangVien } from './entity/giang-vien.entity';
import { PhanCongMonHocDto } from './dtos/phan-cong-mon-hoc.dto';
import { XoaPhanCongMonHocDto } from './dtos/xoa-phan-cong-mon-hoc.dto';
import { GiangVienMonHoc } from './entity/giangvien-monhoc.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { VaiTroNguoiDungEnum } from 'src/auth/enums/vai-tro-nguoi-dung.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UpdateNienKhoaDto } from './dtos/cap-nhat-nien-khoa.dto';
import { CreateNienKhoaDto } from './dtos/them-nien-khoa.dto';
import { NienKhoa } from './entity/nien-khoa.entity';
import { PaginationQueryDto, GetNganhQueryDto, GetLopQueryDto, GetGiangVienQueryDto } from './dtos/pagination.dto';
import { PhanCongMonHocResponseDto } from './dtos/phan-cong-mon-hoc-response.dto';

@Controller('danh-muc')
export class DanhMucController {
  constructor(
    private readonly danhMucService: DanhMucService
  ) { }

  // GET /danh-muc/khoa
  @Get('khoa')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  async getAllKhoa(@Query() query: PaginationQueryDto) {
    return this.danhMucService.getAllKhoa(query);
  }

  // GET /danh-muc/khoa/:id
  @Get('khoa/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  async getKhoaById(@Param('id', ParseIntPipe) id: number): Promise<Khoa> {
    return this.danhMucService.getKhoaById(id);
  }

  // POST /danh-muc/khoa
  @Post('khoa')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  @HttpCode(HttpStatus.CREATED)
  async createKhoa(@Body() createKhoaDto: CreateKhoaDto): Promise<Khoa> {
    return this.danhMucService.createKhoa(createKhoaDto);
  }

  // PUT /danh-muc/khoa/:id
  @Put('khoa/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  async updateKhoa(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateKhoaDto: UpdateKhoaDto,
  ): Promise<Khoa> {
    return this.danhMucService.updateKhoa(id, updateKhoaDto);
  }

  // DELETE /danh-muc/khoa/:id
  @Delete('khoa/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteKhoa(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.danhMucService.deleteKhoa(id);
  }

  // GET /danh-muc/nganh?khoaId=...
  @Get('nganh')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  async getAllNganh(@Query() query: PaginationQueryDto & GetNganhQueryDto) {
    return this.danhMucService.getAllNganh(query);
  }

  // GET /danh-muc/nganh/:id
  @Get('nganh/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  async getNganhById(@Param('id', ParseIntPipe) id: number): Promise<Nganh> {
    return this.danhMucService.getNganhById(id);
  }

  // POST /danh-muc/nganh
  @Post('nganh')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  @HttpCode(HttpStatus.CREATED)
  async createNganh(@Body() createNganhDto: CreateNganhDto): Promise<Nganh> {
    return this.danhMucService.createNganh(createNganhDto);
  }

  // PUT /danh-muc/nganh/:id
  @Put('nganh/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  async updateNganh(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNganhDto: UpdateNganhDto,
  ): Promise<Nganh> {
    return this.danhMucService.updateNganh(id, updateNganhDto);
  }

  // DELETE /danh-muc/nganh/:id
  @Delete('nganh/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNganh(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.danhMucService.deleteNganh(id);
  }

  // GET /danh-muc/nien-khoa
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  @Get('nien-khoa')
  async getAllNienKhoa(@Query() query: PaginationQueryDto) {
    return this.danhMucService.getAllNienKhoa(query);
  }

  // GET /danh-muc/nien-khoa/:id 
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  @Get('nien-khoa/:id')
  async getNienKhoaById(@Param('id', ParseIntPipe) id: number): Promise<NienKhoa> {
    return this.danhMucService.getNienKhoaById(id);
  }

  // POST /danh-muc/nien-khoa (chỉ cán bộ phòng ĐT)
  @Post('nien-khoa')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.CREATED)
  async createNienKhoa(@Body() createNienKhoaDto: CreateNienKhoaDto): Promise<NienKhoa> {
    return this.danhMucService.createNienKhoa(createNienKhoaDto);
  }

  // PUT /danh-muc/nien-khoa/:id (chỉ cán bộ phòng ĐT)
  @Put('nien-khoa/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async updateNienKhoa(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNienKhoaDto: UpdateNienKhoaDto,
  ): Promise<NienKhoa> {
    return this.danhMucService.updateNienKhoa(id, updateNienKhoaDto);
  }

  // DELETE /danh-muc/nien-khoa/:id (chỉ cán bộ phòng ĐT)
  @Delete('nien-khoa/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNienKhoa(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.danhMucService.deleteNienKhoa(id);
  }

  // GET /danh-muc/lop?nganhId=...&nienKhoaId=...
  @Get('lop')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  async getAllLop(@Query() query: PaginationQueryDto & GetLopQueryDto) {
    return this.danhMucService.getAllLop(query);
  }

  // GET /danh-muc/lop/:id
  @Get('lop/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  async getLopById(@Param('id', ParseIntPipe) id: number): Promise<Lop> {
    return this.danhMucService.getLopById(id);
  }

  // POST /danh-muc/lop
  @Post('lop')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  @HttpCode(HttpStatus.CREATED)
  async createLop(@Body() createLopDto: CreateLopDto): Promise<Lop> {
    return this.danhMucService.createLop(createLopDto);
  }

  // PUT /danh-muc/lop/:id
  @Put('lop/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  async updateLop(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLopDto: UpdateLopDto,
  ): Promise<Lop> {
    return this.danhMucService.updateLop(id, updateLopDto);
  }

  // DELETE /danh-muc/lop/:id
  @Delete('lop/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLop(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.danhMucService.deleteLop(id);
  }

  // GET /danh-muc/mon-hoc
  @Get('mon-hoc')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  async getAllMonHoc() {
    return this.danhMucService.getAllMonHoc();
  }

  // version /danh-muc/mon-hoc có phân trang
  @Get('mon-hoc/paginated')
  async getAllMonHocWithPagination(@Query() query: PaginationQueryDto) {
    return this.danhMucService.getAllMonHocWithPagination(query);
  }

  // GET /danh-muc/mon-hoc/:id
  @Get('mon-hoc/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  async getMonHocById(@Param('id', ParseIntPipe) id: number): Promise<MonHoc> {
    return this.danhMucService.getMonHocById(id);
  }

  // POST /danh-muc/mon-hoc
  @Post('mon-hoc')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  @HttpCode(HttpStatus.CREATED)
  async createMonHoc(@Body() createMonHocDto: CreateMonHocDto): Promise<MonHoc> {
    return this.danhMucService.createMonHoc(createMonHocDto);
  }

  // PUT /danh-muc/mon-hoc/:id
  @Put('mon-hoc/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  async updateMonHoc(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMonHocDto: UpdateMonHocDto,
  ): Promise<MonHoc> {
    return this.danhMucService.updateMonHoc(id, updateMonHocDto);
  }

  // DELETE /danh-muc/mon-hoc/:id
  @Delete('mon-hoc/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMonHoc(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.danhMucService.deleteMonHoc(id);
  }

  // GET /danh-muc/giang-vien
  @Get('giang-vien')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  async getAllGiangVien(@Query() query: PaginationQueryDto & GetGiangVienQueryDto) {
    return this.danhMucService.getAllGiangVien(query);
  }

  // GET /danh-muc/giang-vien/:id
  @Get('giang-vien/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  async getGiangVienById(@Param('id', ParseIntPipe) id: number): Promise<GiangVien> {
    return this.danhMucService.getGiangVienById(id);
  }

  // POST /danh-muc/giang-vien
  @Post('giang-vien')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  @HttpCode(HttpStatus.CREATED)
  async createGiangVien(@Body() createGiangVienDto: CreateGiangVienDto): Promise<GiangVien> {
    return this.danhMucService.createGiangVien(createGiangVienDto);
  }

  // PUT /danh-muc/giang-vien/:id
  @Put('giang-vien/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  async updateGiangVien(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGiangVienDto: UpdateGiangVienDto,
  ): Promise<GiangVien> {
    return this.danhMucService.updateGiangVien(id, updateGiangVienDto);
  }

  // DELETE /danh-muc/giang-vien/:id
  @Delete('giang-vien/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGiangVien(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.danhMucService.deleteGiangVien(id);
  }

  // PUT /danh-muc/giang-vien/me
  // Chỉ giảng viên đang đăng nhập mới được gọi
  @Put('giang-vien/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.GIANG_VIEN)
  async updateMyProfile(
    @GetUser('sub') userId: number,
    @GetUser('role') vaiTro: string,
    @Body() updateGiangVienDto: UpdateGiangVienDto,
  ): Promise<GiangVien> {
    return this.danhMucService.updateMyProfile({ userId, vaiTro }, updateGiangVienDto);
  }

  // POST /danh-muc/giang-vien/phancongmonhoc
  // Body: { "giangVienId": 5, "monHocId": 10 }
  @Post('giang-vien/phancongmonhoc')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  @HttpCode(HttpStatus.CREATED)
  async phanCongMonHoc(@Body() dto: PhanCongMonHocDto): Promise<GiangVienMonHoc> {
    return this.danhMucService.phanCongMonHoc(dto);
  }

  // DELETE: Xóa phân công môn học cho giảng viên
  // URL: DELETE /danh-muc/giang-vien/:giangVienId/phan-cong-mon-hoc/:monHocId
  @Delete('giang-vien/:giangVienId/phan-cong-mon-hoc/:monHocId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  @HttpCode(HttpStatus.NO_CONTENT)
  async xoaPhanCongMonHoc(
    @Param('giangVienId', ParseIntPipe) giangVienId: number,
    @Param('monHocId', ParseIntPipe) monHocId: number,
  ): Promise<void> {
    await this.danhMucService.xoaPhanCongMonHoc({ giangVienId, monHocId });
  }

  // GET: Lấy danh sách môn học được phân công của một giảng viên
  // URL: GET /danh-muc/giang-vien/:giangVienId/phan-cong-mon-hoc
  @Get('giang-vien/:giangVienId/phan-cong-mon-hoc')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAN_BO_PHONG_DAO_TAO')
  async getMonHocGiangVien(
    @Param('giangVienId', ParseIntPipe) giangVienId: number,
  ): Promise<PhanCongMonHocResponseDto> {
    return this.danhMucService.getMonHocByGiangVien(giangVienId);
  }
}