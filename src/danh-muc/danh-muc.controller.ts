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
  Query,
  UseGuards,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { DanhMucService } from './danh-muc.service';
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
import { CapNhatThongTinCaNhanGiangVienDto, UpdateGiangVienDto } from './dtos/cap-nhat-thong-tin-giang-vien.dto';
import { CreateGiangVienDto } from './dtos/them-giang-vien.dto';
import { GiangVien } from './entity/giang-vien.entity';
import { PhanCongMonHocDto } from './dtos/phan-cong-mon-hoc.dto';
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
import { GetAllMonHocQueryDto, PhanCongMonHocResponseDto } from './dtos/phan-cong-mon-hoc-response.dto';
import { GetAllKhoaResponseDto, GetKhoaByIdResponseDto } from './dtos/get-all-khoa-response.dto';
import { GetAllNganhResponseDto, GetNganhByIdResponseDto } from './dtos/get-all-nganh-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import express from 'express';

@ApiTags('Danh mục')
@Controller('danh-muc')
export class DanhMucController {
  constructor(private readonly danhMucService: DanhMucService) { }

  /* ==================== KHOA ==================== */
  @ApiOperation({ summary: 'Lấy danh sách tất cả khoa (có phân trang và tìm kiếm)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang hiện tại (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số bản ghi mỗi trang (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Tìm kiếm theo mã hoặc tên khoa' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách khoa kèm ngành thuộc khoa và phân trang',
    type: GetAllKhoaResponseDto, // <-- Quan trọng: khai báo type response
  })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({ description: 'Không có quyền (chỉ cán bộ phòng ĐT)' })
  @Get('khoa')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO, VaiTroNguoiDungEnum.GIANG_VIEN)
  async getAllKhoa(@Query() query: PaginationQueryDto) {
    return this.danhMucService.getAllKhoa(query);
  }

  @ApiOperation({ summary: 'Lấy thông tin chi tiết khoa theo ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID của khoa' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin chi tiết khoa',
    type: GetKhoaByIdResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khoa' })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({ description: 'Không có quyền (chỉ cán bộ phòng ĐT)' })
  @Get('khoa/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getKhoaById(@Param('id', ParseIntPipe) id: number): Promise<Khoa> {
    return this.danhMucService.getKhoaById(id);
  }

  @ApiOperation({ summary: 'Tạo khoa mới' })
  @ApiBody({ type: CreateKhoaDto })
  @ApiResponse({ status: 201, description: 'Khoa đã được tạo', type: Khoa })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @Post('khoa')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.CREATED)
  async createKhoa(@Body() createKhoaDto: CreateKhoaDto): Promise<Khoa> {
    return this.danhMucService.createKhoa(createKhoaDto);
  }

  @ApiOperation({ summary: 'Cập nhật thông tin khoa' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateKhoaDto })
  @ApiResponse({ status: 200, description: 'Khoa đã được cập nhật', type: Khoa })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @Put('khoa/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async updateKhoa(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateKhoaDto: UpdateKhoaDto,
  ): Promise<Khoa> {
    return this.danhMucService.updateKhoa(id, updateKhoaDto);
  }

  @ApiOperation({ summary: 'Xóa khoa' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @Delete('khoa/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteKhoa(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.danhMucService.deleteKhoa(id);
  }

  /* ==================== NGÀNH ==================== */
  @ApiOperation({
    summary: 'Lấy danh sách ngành (có lọc theo khoa, tìm kiếm và phân trang)'
  })
  @ApiQuery({ name: 'khoaId', required: false, type: Number, description: 'Lọc theo ID khoa' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang hiện tại (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số bản ghi mỗi trang (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Tìm kiếm theo mã hoặc tên ngành' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách ngành kèm thông tin khoa, filters và phân trang',
    type: GetAllNganhResponseDto,
  })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({ description: 'Không có quyền (chỉ cán bộ phòng ĐT)' })
  @Get('nganh')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO, VaiTroNguoiDungEnum.GIANG_VIEN)
  async getAllNganh(@Query() query: PaginationQueryDto & GetNganhQueryDto) {
    return this.danhMucService.getAllNganh(query);
  }

  @ApiOperation({ summary: 'Lấy thông tin chi tiết ngành theo ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID ngành' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin chi tiết ngành kèm khoa quản lý',
    type: GetNganhByIdResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ngành' })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({ description: 'Không có quyền (chỉ cán bộ phòng ĐT)' })
  @Get('nganh/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getNganhById(@Param('id', ParseIntPipe) id: number): Promise<Nganh> {
    return this.danhMucService.getNganhById(id);
  }

  @Post('nganh/import-excel')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(xlsx|xls)$/)) {
          return cb(new BadRequestException('Chỉ chấp nhận file .xlsx hoặc .xls'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiOperation({
    summary: 'Nhập danh sách ngành từ file Excel',
    description:
      'File cần có cột: STT (bỏ qua), Mã ngành, Tên ngành, Mô tả (tùy chọn), Mã khoa (dùng để tra cứu khoa). ' +
      'Mã khoa là mã nghiệp vụ (maKhoa), không phải ID.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async importNganhFromExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Không có file được tải lên');

    return this.danhMucService.importNganhFromExcel(file.path);
  }

  @ApiOperation({ summary: 'Tạo ngành mới' })
  @ApiBody({ type: CreateNganhDto })
  @ApiResponse({ status: 201, type: Nganh })
  @ApiBearerAuth()
  @Post('nganh')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.CREATED)
  async createNganh(@Body() createNganhDto: CreateNganhDto): Promise<Nganh> {
    return this.danhMucService.createNganh(createNganhDto);
  }

  @ApiOperation({ summary: 'Cập nhật ngành' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateNganhDto })
  @ApiResponse({ status: 200, type: Nganh })
  @ApiBearerAuth()
  @Put('nganh/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async updateNganh(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNganhDto: UpdateNganhDto,
  ): Promise<Nganh> {
    return this.danhMucService.updateNganh(id, updateNganhDto);
  }

  @ApiOperation({ summary: 'Xóa ngành' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204 })
  @ApiBearerAuth()
  @Delete('nganh/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNganh(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.danhMucService.deleteNganh(id);
  }

  /* ==================== NIÊN KHÓA ==================== */
  @ApiOperation({ summary: 'Lấy danh sách niên khóa (có phân trang)' })
  @ApiResponse({ status: 200, type: [NienKhoa] })
  @ApiBearerAuth()
  @Get('nien-khoa')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO, VaiTroNguoiDungEnum.GIANG_VIEN)
  async getAllNienKhoa(@Query() query: PaginationQueryDto) {
    return this.danhMucService.getAllNienKhoa(query);
  }

  @ApiOperation({ summary: 'Lấy thông tin niên khóa theo ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: NienKhoa })
  @ApiBearerAuth()
  @Get('nien-khoa/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getNienKhoaById(@Param('id', ParseIntPipe) id: number): Promise<NienKhoa> {
    return this.danhMucService.getNienKhoaById(id);
  }

  @ApiOperation({ summary: 'Tạo niên khóa mới' })
  @ApiBody({ type: CreateNienKhoaDto })
  @ApiResponse({ status: 201, type: NienKhoa })
  @ApiBearerAuth()
  @Post('nien-khoa')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.CREATED)
  async createNienKhoa(@Body() createNienKhoaDto: CreateNienKhoaDto): Promise<NienKhoa> {
    return this.danhMucService.createNienKhoa(createNienKhoaDto);
  }

  @ApiOperation({ summary: 'Cập nhật niên khóa' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateNienKhoaDto })
  @ApiResponse({ status: 200, type: NienKhoa })
  @ApiBearerAuth()
  @Put('nien-khoa/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async updateNienKhoa(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNienKhoaDto: UpdateNienKhoaDto,
  ): Promise<NienKhoa> {
    return this.danhMucService.updateNienKhoa(id, updateNienKhoaDto);
  }

  @ApiOperation({ summary: 'Xóa niên khóa' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204 })
  @ApiBearerAuth()
  @Delete('nien-khoa/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNienKhoa(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.danhMucService.deleteNienKhoa(id);
  }

  /* ==================== LỚP ==================== */
  @ApiOperation({ summary: 'Lấy danh sách lớp (lọc theo ngành và niên khóa, có phân trang)' })
  @ApiQuery({ name: 'nganhId', required: false, type: Number })
  @ApiQuery({ name: 'nienKhoaId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [Lop] })
  @ApiBearerAuth()
  @Get('lop')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getAllLop(@Query() query: PaginationQueryDto & GetLopQueryDto) {
    return this.danhMucService.getAllLop(query);
  }

  @ApiOperation({ summary: 'Lấy thông tin lớp theo ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Lop })
  @ApiBearerAuth()
  @Get('lop/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getLopById(@Param('id', ParseIntPipe) id: number): Promise<Lop> {
    return this.danhMucService.getLopById(id);
  }

  @Post('lop/import-excel')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(xlsx|xls)$/)) {
          return cb(new BadRequestException('Chỉ chấp nhận file .xlsx hoặc .xls'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiOperation({
    summary: 'Nhập danh sách lớp niên chế từ file Excel',
    description: 'File cần có cột: STT (bỏ qua), Mã Lớp, Tên Lớp, Mã Ngành, Mã Niên Khóa',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async importLopFromExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Không có file được tải lên');

    return this.danhMucService.importLopFromExcel(file.path);
  }

  @ApiOperation({ summary: 'Tạo lớp mới' })
  @ApiBody({ type: CreateLopDto })
  @ApiResponse({ status: 201, type: Lop })
  @ApiBearerAuth()
  @Post('lop')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.CREATED)
  async createLop(@Body() createLopDto: CreateLopDto): Promise<Lop> {
    return this.danhMucService.createLop(createLopDto);
  }

  @ApiOperation({ summary: 'Cập nhật lớp' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateLopDto })
  @ApiResponse({ status: 200, type: Lop })
  @ApiBearerAuth()
  @Put('lop/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async updateLop(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLopDto: UpdateLopDto,
  ): Promise<Lop> {
    return this.danhMucService.updateLop(id, updateLopDto);
  }

  @ApiOperation({ summary: 'Xóa lớp' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204 })
  @ApiBearerAuth()
  @Delete('lop/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLop(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.danhMucService.deleteLop(id);
  }

  /* ==================== MÔN HỌC ==================== */
  @ApiOperation({ summary: 'Lấy tất cả môn học (không phân trang)' })
  @ApiResponse({ status: 200, type: [MonHoc] })
  @ApiBearerAuth()
  @Get('mon-hoc')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO, VaiTroNguoiDungEnum.GIANG_VIEN)
  async getAllMonHoc(@Query() query: GetAllMonHocQueryDto) {
    return this.danhMucService.getAllMonHoc(query);
  }

  @ApiOperation({ summary: 'Xuất danh sách môn học ra Excel' })
  @ApiResponse({ status: 200, description: 'File Excel được tải về' })
  @ApiBearerAuth()
  @Get('mon-hoc/export-excel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async exportMonHocToExcel(@Query() query: GetAllMonHocQueryDto, @Res() res: express.Response) {
    const buffer = await this.danhMucService.exportMonHocToExcel(query);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=danh-sach-mon-hoc-${Date.now()}.xlsx`);
    res.send(buffer);
  }

  @ApiOperation({
    summary: 'Lấy danh sách môn học có phân trang',
    description:
      'Trả về danh sách môn học kèm thông tin giảng viên phụ trách. Tìm kiếm theo mã/tên môn học hoặc mã/tên giảng viên (query: search).',
  })
  @ApiResponse({ status: 200, type: [MonHoc] })
  @ApiBearerAuth()
  @Get('mon-hoc/paginated')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getAllMonHocWithPagination(@Query() query: PaginationQueryDto) {
    return this.danhMucService.getAllMonHocWithPagination(query);
  }

  @ApiOperation({ summary: 'Lấy môn học theo ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: MonHoc })
  @ApiBearerAuth()
  @Get('mon-hoc/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getMonHocById(@Param('id', ParseIntPipe) id: number): Promise<MonHoc> {
    return this.danhMucService.getMonHocById(id);
  }

  @Post('mon-hoc/import-excel')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(xlsx|xls)$/)) {
          return cb(new BadRequestException('Chỉ chấp nhận file .xlsx hoặc .xls'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiOperation({
    summary: 'Nhập danh sách môn học từ file Excel',
    description: 'File cần có cột: STT (bỏ qua), Mã Môn, Tên Môn, Loại Môn, Tín chỉ, Mô tả (tùy chọn)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async importMonHocFromExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Không có file được tải lên');

    return this.danhMucService.importMonHocFromExcel(file.path);
  }

  @ApiOperation({ summary: 'Tạo môn học mới' })
  @ApiBody({ type: CreateMonHocDto })
  @ApiResponse({ status: 201, type: MonHoc })
  @ApiBearerAuth()
  @Post('mon-hoc')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.CREATED)
  async createMonHoc(@Body() createMonHocDto: CreateMonHocDto): Promise<MonHoc> {
    return this.danhMucService.createMonHoc(createMonHocDto);
  }

  @ApiOperation({ summary: 'Cập nhật môn học' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateMonHocDto })
  @ApiResponse({ status: 200, type: MonHoc })
  @ApiBearerAuth()
  @Put('mon-hoc/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async updateMonHoc(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMonHocDto: UpdateMonHocDto,
  ): Promise<MonHoc> {
    return this.danhMucService.updateMonHoc(id, updateMonHocDto);
  }

  @ApiOperation({ summary: 'Xóa môn học' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204 })
  @ApiBearerAuth()
  @Delete('mon-hoc/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMonHoc(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.danhMucService.deleteMonHoc(id);
  }

  /* ==================== GIẢNG VIÊN ==================== */

   @ApiOperation({ summary: 'Xuất file Excel mẫu nhập giảng viên' })
  @ApiResponse({ status: 200, description: 'File Excel mẫu nhập giảng viên được tải về' })
  @ApiBearerAuth()
  @Get('giang-vien/export-excel-template')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async exportMauNhapGiangVienExcel(@Res() res: express.Response) {
    const buffer = await this.danhMucService.exportMauNhapGiangVienExcel();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=mau-nhap-giang-vien-${Date.now()}.xlsx`
    );

    res.send(buffer);
  }


  @ApiOperation({ summary: 'Giảng viên cập nhật thông tin cá nhân của mình' })
  @ApiBody({ type: CapNhatThongTinCaNhanGiangVienDto })
  @ApiResponse({ status: 200, type: GiangVien })
  @ApiBearerAuth()
  @ApiForbiddenResponse({ description: 'Chỉ giảng viên mới được phép làm' })
  @Put('giang-vien/me/my-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.GIANG_VIEN, VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async updateMyProfile(
    @GetUser('userId') userId: number,
    @GetUser('vaiTro') vaiTro: string,
    @Body() capNhatThongTinCaNhanGiangVienDto: CapNhatThongTinCaNhanGiangVienDto,
  ): Promise<GiangVien> {
    return this.danhMucService.updateMyProfile({ userId, vaiTro }, capNhatThongTinCaNhanGiangVienDto);
  }

  @ApiOperation({ summary: 'Xuất danh sách giảng viên ra Excel' })
  @ApiResponse({ status: 200, description: 'File Excel được tải về' })
  @ApiBearerAuth()
  @Get('giang-vien/export-excel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async exportGiangVienToExcel(@Query() query: PaginationQueryDto & GetGiangVienQueryDto, @Res() res: express.Response) {
    const buffer = await this.danhMucService.exportGiangVienToExcel(query);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=danh-sach-giang-vien-${Date.now()}.xlsx`);
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Lấy thông tin cá nhân giảng viên' })
  @ApiResponse({ status: 200, type: GiangVien })
  @ApiBearerAuth()
  @ApiForbiddenResponse({ description: 'Chỉ giảng viên mới được phép' })
  @Get('giang-vien/me/my-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.GIANG_VIEN, VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getMyProfile(
    @GetUser('userId') userId: number,
    @GetUser('vaiTro') vaiTro: string,
  ): Promise<GiangVien> {
    return this.danhMucService.getMyProfile({ userId, vaiTro });
  }

  @ApiOperation({ summary: 'Lấy danh sách giảng viên (có lọc và phân trang)' })
  @ApiResponse({ status: 200, type: [GiangVien] })
  @ApiBearerAuth()
  @Get('giang-vien')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getAllGiangVien(@Query() query: PaginationQueryDto & GetGiangVienQueryDto) {
    return this.danhMucService.getAllGiangVien(query);
  }

  @ApiOperation({ summary: 'Lấy thông tin giảng viên theo ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: GiangVien })
  @ApiBearerAuth()
  @Get('giang-vien/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getGiangVienById(@Param('id', ParseIntPipe) id: number): Promise<GiangVien> {
    return this.danhMucService.getGiangVienById(id);
  }

  @Post('giang-vien/import-excel')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(xlsx|xls)$/)) {
          return cb(new BadRequestException('Chỉ chấp nhận file .xlsx hoặc .xls'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({
    summary: 'Nhập danh sách giảng viên từ file Excel',
    description:
      'Cột: STT (bỏ qua), Mã giảng viên, Họ tên, Ngày sinh (YYYY-MM-DD), Email, SĐT, Giới tính (NAM/NU/KHONG_XAC_DINH), Địa chỉ',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async importGiangVienFromExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Không có file được tải lên');

    return this.danhMucService.importGiangVienFromExcel(file.path);
  }

  @ApiOperation({ summary: 'Tạo giảng viên mới' })
  @ApiBody({ type: CreateGiangVienDto })
  @ApiResponse({ status: 201, type: GiangVien })
  @ApiBearerAuth()
  @Post('giang-vien')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.CREATED)
  async createGiangVien(@Body() createGiangVienDto: CreateGiangVienDto): Promise<GiangVien> {
    return this.danhMucService.createGiangVien(createGiangVienDto);
  }

  @ApiOperation({ summary: 'Cập nhật thông tin giảng viên (bởi cán bộ phòng ĐT)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateGiangVienDto })
  @ApiResponse({ status: 200, type: GiangVien })
  @ApiBearerAuth()
  @Put('giang-vien/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async updateGiangVien(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGiangVienDto: UpdateGiangVienDto,
  ): Promise<GiangVien> {
    return this.danhMucService.updateGiangVien(id, updateGiangVienDto);
  }

  @ApiOperation({ summary: 'Xóa giảng viên' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204 })
  @ApiBearerAuth()
  @Delete('giang-vien/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGiangVien(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.danhMucService.deleteGiangVien(id);
  }

  /* ==================== PHÂN CÔNG MÔN HỌC ==================== */
  @ApiOperation({ summary: 'Phân công môn học cho giảng viên' })
  @ApiBody({ type: PhanCongMonHocDto })
  @ApiResponse({ status: 201, type: GiangVienMonHoc })
  @ApiBearerAuth()
  @Post('giang-vien/phancongmonhoc')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.CREATED)
  async phanCongMonHoc(@Body() dto: PhanCongMonHocDto): Promise<GiangVienMonHoc> {
    return this.danhMucService.phanCongMonHoc(dto);
  }

  @ApiOperation({ summary: 'Xóa phân công môn học của giảng viên' })
  @ApiParam({ name: 'giangVienId', type: Number })
  @ApiParam({ name: 'monHocId', type: Number })
  @ApiResponse({ status: 204 })
  @ApiBearerAuth()
  @Delete('giang-vien/:giangVienId/phan-cong-mon-hoc/:monHocId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async xoaPhanCongMonHoc(
    @Param('giangVienId', ParseIntPipe) giangVienId: number,
    @Param('monHocId', ParseIntPipe) monHocId: number,
  ): Promise<void> {
    await this.danhMucService.xoaPhanCongMonHoc({ giangVienId, monHocId });
  }

  @ApiOperation({ summary: 'Lấy danh sách môn học đã được phân công cho giảng viên' })
  @ApiParam({ name: 'giangVienId', type: Number })
  @ApiResponse({ status: 200, type: PhanCongMonHocResponseDto })
  @ApiBearerAuth()
  @Get('giang-vien/:giangVienId/phan-cong-mon-hoc')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getMonHocGiangVien(
    @Param('giangVienId', ParseIntPipe) giangVienId: number,
  ): Promise<PhanCongMonHocResponseDto> {
    return this.danhMucService.getMonHocByGiangVien(giangVienId);
  }
}