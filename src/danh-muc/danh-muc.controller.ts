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
import { Request } from 'express';
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

@Controller('danh-muc/khoa')
export class DanhMucController {
  constructor(private readonly danhMucService: DanhMucService) { }

  // GET /danh-muc/khoa
  @Get()
  async getAllKhoa(): Promise<Khoa[]> {
    return this.danhMucService.getAllKhoa();
  }

  // GET /danh-muc/khoa/:id
  @Get(':id')
  async getKhoaById(@Param('id', ParseIntPipe) id: number): Promise<Khoa> {
    return this.danhMucService.getKhoaById(id);
  }

  // POST /danh-muc/khoa
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createKhoa(@Body() createKhoaDto: CreateKhoaDto): Promise<Khoa> {
    return this.danhMucService.createKhoa(createKhoaDto);
  }

  // PUT /danh-muc/khoa/:id
  @Put(':id')
  async updateKhoa(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateKhoaDto: UpdateKhoaDto,
  ): Promise<Khoa> {
    return this.danhMucService.updateKhoa(id, updateKhoaDto);
  }

  // GET /danh-muc/nganh?khoaId=...
  @Get('nganh')
  async getAllNganh(@Query('khoaId') khoaId?: string): Promise<Nganh[]> {
    const id = khoaId ? parseInt(khoaId, 10) : undefined;
    if (khoaId && id !== undefined && isNaN(id)) {
      throw new BadRequestException('khoaId phải là số');
    }
    return this.danhMucService.getAllNganh(id);
  }

  // GET /danh-muc/nganh/:id
  @Get('nganh/:id')
  async getNganhById(@Param('id', ParseIntPipe) id: number): Promise<Nganh> {
    return this.danhMucService.getNganhById(id);
  }

  // POST /danh-muc/nganh
  @Post('nganh')
  @HttpCode(HttpStatus.CREATED)
  async createNganh(@Body() createNganhDto: CreateNganhDto): Promise<Nganh> {
    return this.danhMucService.createNganh(createNganhDto);
  }

  // PUT /danh-muc/nganh/:id
  @Put('nganh/:id')
  async updateNganh(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNganhDto: UpdateNganhDto,
  ): Promise<Nganh> {
    return this.danhMucService.updateNganh(id, updateNganhDto);
  }

  // DELETE /danh-muc/nganh/:id
  @Delete('nganh/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNganh(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.danhMucService.deleteNganh(id);
  }

  // GET /danh-muc/lop?nganhId=...&nienKhoaId=...
  @Get('lop')
  async getAllLop(
    @Query('nganhId') nganhId?: string,
    @Query('nienKhoaId') nienKhoaId?: string,
  ): Promise<Lop[]> {
    const nganh = nganhId ? parseInt(nganhId, 10) : undefined;
    const nienKhoa = nienKhoaId ? parseInt(nienKhoaId, 10) : undefined;

    if ((nganhId && nganh !== undefined && isNaN(nganh)) || (nienKhoaId && nienKhoa !== undefined && isNaN(nienKhoa))) {
      throw new BadRequestException('nganhId và nienKhoaId phải là số');
    }

    return this.danhMucService.getAllLop(nganh, nienKhoa);
  }

  // GET /danh-muc/lop/:id
  @Get('lop/:id')
  async getLopById(@Param('id', ParseIntPipe) id: number): Promise<Lop> {
    return this.danhMucService.getLopById(id);
  }

  // POST /danh-muc/lop
  @Post('lop')
  @HttpCode(HttpStatus.CREATED)
  async createLop(@Body() createLopDto: CreateLopDto): Promise<Lop> {
    return this.danhMucService.createLop(createLopDto);
  }

  // PUT /danh-muc/lop/:id
  @Put('lop/:id')
  async updateLop(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLopDto: UpdateLopDto,
  ): Promise<Lop> {
    return this.danhMucService.updateLop(id, updateLopDto);
  }

  // DELETE /danh-muc/lop/:id
  @Delete('lop/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLop(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.danhMucService.deleteLop(id);
  }

  // GET /danh-muc/mon-hoc
  @Get('mon-hoc')
  async getAllMonHoc(): Promise<MonHoc[]> {
    return this.danhMucService.getAllMonHoc();
  }

  // GET /danh-muc/mon-hoc/:id
  @Get('mon-hoc/:id')
  async getMonHocById(@Param('id', ParseIntPipe) id: number): Promise<MonHoc> {
    return this.danhMucService.getMonHocById(id);
  }

  // POST /danh-muc/mon-hoc
  @Post('mon-hoc')
  @HttpCode(HttpStatus.CREATED)
  async createMonHoc(@Body() createMonHocDto: CreateMonHocDto): Promise<MonHoc> {
    return this.danhMucService.createMonHoc(createMonHocDto);
  }

  // PUT /danh-muc/mon-hoc/:id
  @Put('mon-hoc/:id')
  async updateMonHoc(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMonHocDto: UpdateMonHocDto,
  ): Promise<MonHoc> {
    return this.danhMucService.updateMonHoc(id, updateMonHocDto);
  }

  // DELETE /danh-muc/mon-hoc/:id
  @Delete('mon-hoc/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMonHoc(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.danhMucService.deleteMonHoc(id);
  }

  // GET /danh-muc/giang-vien
  @Get('giang-vien')
  async getAllGiangVien(): Promise<GiangVien[]> {
    return this.danhMucService.getAllGiangVien();
  }

  // GET /danh-muc/giang-vien/:id
  @Get('giang-vien/:id')
  async getGiangVienById(@Param('id', ParseIntPipe) id: number): Promise<GiangVien> {
    return this.danhMucService.getGiangVienById(id);
  }

  // POST /danh-muc/giang-vien
  @Post('giang-vien')
  @HttpCode(HttpStatus.CREATED)
  async createGiangVien(@Body() createGiangVienDto: CreateGiangVienDto): Promise<GiangVien> {
    return this.danhMucService.createGiangVien(createGiangVienDto);
  }

  // PUT /danh-muc/giang-vien/:id
  @Put('giang-vien/:id')
  async updateGiangVien(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGiangVienDto: UpdateGiangVienDto,
  ): Promise<GiangVien> {
    return this.danhMucService.updateGiangVien(id, updateGiangVienDto);
  }

  // DELETE /danh-muc/giang-vien/:id
  @Delete('giang-vien/:id')
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
  @HttpCode(HttpStatus.CREATED)
  async phanCongMonHoc(@Body() dto: PhanCongMonHocDto): Promise<GiangVienMonHoc> {
    return this.danhMucService.phanCongMonHoc(dto);
  }

  // DELETE /danh-muc/giang-vien/phancongmonhoc
  // Body: { "giangVienId": 5, "monHocId": 10 }
  @Delete('giang-vien/phancongmonhoc')
  @HttpCode(HttpStatus.NO_CONTENT)
  async xoaPhanCongMonHoc(@Body() dto: XoaPhanCongMonHocDto): Promise<void> {
    return this.danhMucService.xoaPhanCongMonHoc(dto);
  }

  // GET /danh-muc/giang-vien/phancongmonhoc?giangVienId=5
  // Trả về danh sách môn học mà giảng viên được phân công dạy
  @Get('giang-vien/phancongmonhoc')
  async getMonHocGiangVien(
    @Query('giangVienId', ParseIntPipe) giangVienId: number,
  ): Promise<MonHoc[]> {
    return this.danhMucService.getMonHocByGiangVien(giangVienId);
  }
}