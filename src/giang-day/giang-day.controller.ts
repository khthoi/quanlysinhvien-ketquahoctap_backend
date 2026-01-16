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
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import express from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiConsumes,
} from '@nestjs/swagger';
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
import { GetMyLopHocPhanQueryDto } from './dtos/get-my-lop-hoc-phan-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { LenKeHoachTaoLhpDto } from './dtos/len-ke-hoach-tao-lhp.dto';

@ApiTags('Giảng dạy')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Chưa đăng nhập hoặc token hết hạn' })
@ApiForbiddenResponse({ description: 'Không có quyền truy cập' })
@Controller('giang-day')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GiangDayController {
  constructor(private readonly giangDayService: GiangDayService) { }

  /* ==================== LỚP HỌC PHẦN (Chỉ cán bộ phòng Đào tạo) ==================== */

  @ApiOperation({ summary: 'Tạo lớp học phần mới' })
  @ApiBody({ type: CreateLopHocPhanDto })
  @ApiResponse({ status: 201, description: 'Lớp học phần đã được tạo thành công' })
  @Post('lop-hoc-phan')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async create(@Body() dto: CreateLopHocPhanDto) {
    return this.giangDayService.create(dto);
  }

  @ApiOperation({ summary: 'Lấy danh sách lớp học phần (có lọc và phân trang)' })
  @ApiQuery({ name: 'monHocId', required: false, type: Number })
  @ApiQuery({ name: 'hocKyId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách lớp học phần' })
  @Get('lop-hoc-phan')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async findAll(@Query() query: GetLopHocPhanQueryDto) {
    return this.giangDayService.findAll(query);
  }

  @ApiOperation({ summary: 'Lấy thông tin chi tiết một lớp học phần' })
  @ApiParam({ name: 'id', type: Number, description: 'ID lớp học phần' })
  @ApiResponse({ status: 200, description: 'Thông tin lớp học phần' })
  @Get('lop-hoc-phan/:id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.giangDayService.findOne(id);
  }

  @ApiOperation({ summary: 'Cập nhật thông tin lớp học phần' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateLopHocPhanDto })
  @ApiResponse({ status: 200, description: 'Lớp học phần đã được cập nhật' })
  @Put('lop-hoc-phan/:id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLopHocPhanDto,
  ) {
    return this.giangDayService.update(id, dto);
  }

  @ApiOperation({ summary: 'Xóa lớp học phần' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @Delete('lop-hoc-phan/:id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.giangDayService.delete(id);
  }

  @ApiOperation({ summary: 'Đăng ký sinh viên vào lớp học phần (cán bộ ĐT)' })
  @ApiParam({ name: 'lop_hoc_phan_id', type: Number, description: 'ID lớp học phần' })
  @ApiParam({ name: 'sinh_vien_id', type: Number, description: 'ID sinh viên' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @Post('lop-hoc-phan/:lop_hoc_phan_id/sinh-vien-dang-ky/:sinh_vien_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.CREATED)
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

  @Post('lop-hoc-phan/them-sv-bang-excel')
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
    summary: 'Thêm danh sách sinh viên vào các lớp học phần bằng file Excel',
    description: `File Excel cần có ít nhất 7 cột:
  - Cột 2: Mã sinh viên (bắt buộc)
  - Cột 7: Mã lớp học phần (maLopHocPhan - bắt buộc, ví dụ: XSTK2024A)
  Các cột khác có thể bỏ qua. Hỗ trợ thêm nhiều lớp học phần trong cùng 1 file.`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File Excel (.xlsx) chứa thông tin sinh viên và mã lớp học phần',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Kết quả thêm sinh viên từ Excel theo từng lớp học phần' })
  async themSinhVienBangExcel(
    @GetUser('userId') userId: number, // Nếu cần audit hoặc kiểm tra quyền
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Không có file được tải lên');

    return this.giangDayService.themSinhVienBangExcelTuFile(file.path);
  }

  @ApiOperation({ summary: 'Xóa sinh viên khỏi lớp học phần' })
  @ApiParam({ name: 'lop_hoc_phan_id', type: Number })
  @ApiParam({ name: 'sinh_vien_id', type: Number })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @Delete('lop-hoc-phan/:lop_hoc_phan_id/sinh-vien-dang-ky/:sinh_vien_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async xoaSinhVienKhoiLop(
    @Param('lop_hoc_phan_id', ParseIntPipe) lopHocPhanId: number,
    @Param('sinh_vien_id', ParseIntPipe) sinhVienId: number,
  ): Promise<void> {
    await this.giangDayService.xoaSinhVienKhoiLop(lopHocPhanId, sinhVienId);
  }

  // Không cần sửa nhiều, chỉ thêm mô tả query mới nếu muốn
  @Get('lop-hoc-phan/danh-sach-sinh-vien/:lop_hoc_phan_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO, VaiTroNguoiDungEnum.GIANG_VIEN)
  @ApiOperation({
    summary: 'Lấy danh sách sinh viên trong một lớp học phần (có phân trang, điểm nếu có)',
    description: 'Cán bộ phòng Đào tạo xem toàn bộ. Giảng viên chỉ xem nếu lớp thuộc mình.',
  })
  @ApiParam({ name: 'lop_hoc_phan_id', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Tìm theo mã SV hoặc tên SV' })
  @ApiQuery({ name: 'maSinhVienSearch', required: false, type: String, description: 'Tìm chính xác theo mã sinh viên' })
  async getDanhSachSinhVien(
    @Param('lop_hoc_phan_id', ParseIntPipe) lopHocPhanId: number,
    @GetUser('userId') userId: number,
    @GetUser('vaiTro') vaiTro: VaiTroNguoiDungEnum,
    @Query() query: GetSinhVienTrongLopQueryDto,
  ) {
    return this.giangDayService.getDanhSachSinhVien(lopHocPhanId, userId, vaiTro, query);
  }

  /* ==================== GIẢNG VIÊN XEM LỚP ĐƯỢC PHÂN CÔNG ==================== */

  @ApiOperation({ summary: 'Giảng viên hoặc cán bộ ĐT xem danh sách lớp học phần của mình' })
  @ApiQuery({ name: 'hocKyId', required: false, type: Number })
  @ApiQuery({ name: 'namHocId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách lớp học phần được phân công' })
  @Get('lop-hoc-phan/giang-vien/me')
  @Roles(VaiTroNguoiDungEnum.GIANG_VIEN, VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getLopHocPhanCuaToi(
    @GetUser('userId') userId: number,
    @Query() query: GetMyLopHocPhanQueryDto,
  ) {
    return this.giangDayService.getLopHocPhanCuaGiangVien(userId, query);
  }

  /* ==================== PHÂN CÔNG GIẢNG VIÊN ==================== */

  @ApiOperation({ summary: 'Phân công hoặc thay đổi giảng viên cho lớp học phần' })
  @ApiParam({ name: 'lop_hoc_phan_id', type: Number })
  @ApiParam({ name: 'giang_vien_id', type: Number })
  @ApiResponse({ status: 200, description: 'Phân công thành công' })
  @Patch('phan-cong/giang-vien/:giang_vien_id/lop-hoc-phan/:lop_hoc_phan_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async phanCongHoacThayDoi(
    @Param('lop_hoc_phan_id', ParseIntPipe) lopHocPhanId: number,
    @Param('giang_vien_id', ParseIntPipe) giangVienId: number,
  ) {
    return this.giangDayService.phanCongGiangVien(lopHocPhanId, giangVienId);
  }

  @ApiOperation({ summary: 'Hủy phân công giảng viên khỏi lớp học phần' })
  @ApiParam({ name: 'lop_hoc_phan_id', type: Number })
  @ApiResponse({ status: 204, description: 'Hủy phân công thành công' })
  @Delete('phan-cong/giang-vien/:giang_vien_id/lop-hoc-phan/:lop_hoc_phan_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async huyPhanCong(
    @Param('lop_hoc_phan_id', ParseIntPipe) lopHocPhanId: number,
  ): Promise<void> {
    await this.giangDayService.huyPhanCongGiangVien(lopHocPhanId);
  }

  @ApiOperation({ summary: 'Lấy danh sách tất cả phân công giảng viên (có lọc và phân trang)' })
  @ApiQuery({ name: 'hocKyId', required: false, type: Number })
  @ApiQuery({ name: 'monHocId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách phân công' })
  @Get('phan-cong')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getDanhSachPhanCong(@Query() query: GetPhanCongQueryDto) {
    return this.giangDayService.getDanhSachPhanCong(query);
  }

  @ApiOperation({ summary: 'Lấy lịch phân công của một giảng viên cụ thể' })
  @ApiParam({ name: 'giang_vien_id', type: Number, description: 'ID giảng viên' })
  @ApiQuery({ name: 'hocKyId', required: false, type: Number })
  @ApiQuery({ name: 'namHocId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách lớp học phần của giảng viên' })
  @Get('giang-vien/:giang_vien_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getLichPhanCongGV(
    @Param('giang_vien_id', ParseIntPipe) giangVienId: number,
    @Query() query: GetMyLopHocPhanQueryDto,
  ) {
    return this.giangDayService.getLopHocPhanCuaGiangVien(giangVienId, query);
  }

  @ApiOperation({ summary: 'Khóa điểm của lớp học phần (không cho sửa điểm nữa)' })
  @ApiParam({ name: 'lop_hoc_phan_id', type: Number })
  @ApiResponse({ status: 200, description: 'Khóa điểm thành công' })
  @Patch('lop-hoc-phan/khoa-diem/:lop_hoc_phan_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO, VaiTroNguoiDungEnum.GIANG_VIEN)
  async khoaDiemLopHocPhan(
    @GetUser('userId') userId: number,
    @Param('lop_hoc_phan_id', ParseIntPipe) lopHocPhanId: number,
  ) {
    await this.giangDayService.khoaDiemLopHocPhan(lopHocPhanId, userId);
    return {
      message: 'Khóa điểm lớp học phần thành công',
    };
  }

  @Post('len-ke-hoach-tao-lhp')
  @ApiBearerAuth()
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @ApiOperation({ summary: 'Lên kế hoạch tạo lớp học phần' })
  async lenKeHoachTaoLhp(
    @Body() dto: LenKeHoachTaoLhpDto,
    @Res() res: express.Response,
  ) {
    const buffer = await this.giangDayService.lenKeHoachTaoLhp(
      dto.maNamHoc,
      dto.hocKy,
    );

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="ke-hoach-tao-lhp.xlsx"',
    });

    return res.send(buffer);
  }

  @Post('lop-hoc-phan/import-tu-excel')
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
          return cb(new BadRequestException('Chỉ chấp nhận file . xlsx hoặc .xls'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  @ApiOperation({
    summary: 'Import hàng loạt lớp học phần từ file Excel',
    description: `File Excel cần có các cột theo thứ tự: 
- Cột 1: STT (bỏ qua)
- Cột 2: Mã Lớp Học Phần (bắt buộc)
- Cột 3: Ghi chú
- Cột 4: Mã Ngành (bắt buộc)
- Cột 5: Mã Niên Khóa (bắt buộc)
- Cột 6: Mã Môn Học (bắt buộc)
- Cột 7: Mã Năm Học (bắt buộc)
- Cột 8: Học kỳ (bắt buộc, số)
- Cột 9: Số tín chỉ (bỏ qua)
- Cột 10: Mã Giảng Viên

Hệ thống sẽ tự động: 
1. Validate dữ liệu (mã lớp trùng, giảng viên được phân công, môn học trong CTDT, giới hạn tín chỉ GV...)
2. Tạo lớp học phần
3. Thêm tối đa 50 sinh viên chưa học môn này vào lớp`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File Excel (.xlsx) chứa danh sách lớp học phần cần tạo',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Kết quả import lớp học phần từ Excel' })
  async importLopHocPhanTuExcel(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Không có file được tải lên');

    return this.giangDayService.importLopHocPhanTuExcel(file.path);
  }

}