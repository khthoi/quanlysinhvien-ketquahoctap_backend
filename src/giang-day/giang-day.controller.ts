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
import { ImportLopHocPhanJsonDto } from './dtos/import-lop-hoc-phan.dto';
import { GetDanhSachYeuCauHocPhanResponseDto, GetDanhSachYeuCauHocPhanPaginatedResponseDto } from './dtos/get-danh-sach-yeu-cau-hoc-phan.dto';
import {
  DuyetYeuCauHocPhanDto,
  TuChoiYeuCauHocPhanDto,
  ChuyenTrangThaiDangXuLyDto,
} from './dtos/xu-ly-yeu-cau-hoc-phan.dto';
import { GetDanhSachYeuCauHocPhanQueryDto } from './dtos/get-danh-sach-yeu-cau-hoc-phan-query.dto';
import {
  GetDeXuatLopHocPhanChoHocLaiResponseDto,
  TaoLopHocPhanChoHocLaiDto,
} from './dtos/de-xuat-lop-hoc-phan-cho-hoc-lai.dto';
import {
  GetDeXuatLopHocPhanChoHocBoSungCaiThienResponseDto,
  TaoLopHocPhanChoHocBoSungCaiThienDto,
} from './dtos/de-xuat-lop-hoc-phan-cho-hoc-bo-sung-cai-thien.dto';

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
  @ApiQuery({
    name: 'loaiThamGia',
    required: false,
    enum: ['CHINH_QUY', 'HOC_LAI', 'HOC_CAI_THIEN', 'HOC_BO_SUNG'],
    description: 'Lọc theo loại tham gia lớp học phần',
  })
  async getDanhSachSinhVien(
    @Param('lop_hoc_phan_id', ParseIntPipe) lopHocPhanId: number,
    @GetUser('userId') userId: number,
    @GetUser('vaiTro') vaiTro: VaiTroNguoiDungEnum,
    @Query() query: GetSinhVienTrongLopQueryDto,
  ) {
    return this.giangDayService.getDanhSachSinhVien(lopHocPhanId, userId, vaiTro, query);
  }

  @Get('lop-hoc-phan/:id/export-mau-nhap-diem')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO, VaiTroNguoiDungEnum.GIANG_VIEN)
  @ApiOperation({
    summary: 'Xuất file Excel mẫu nhập điểm cho lớp học phần',
    description:
      'Tải file Excel gồm STT, mã sinh viên, họ tên, ngày sinh (dd/mm/yyyy), lớp niên chế, điểm 10%, 30%, 60% để giảng viên nhập điểm.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID lớp học phần' })
  @ApiResponse({ status: 200, description: 'File Excel mẫu nhập điểm' })
  async exportMauNhapDiem(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('userId') userId: number,
    @GetUser('vaiTro') vaiTro: VaiTroNguoiDungEnum,
    @Res() res: express.Response,
  ) {
    const { buffer, maLopHocPhan } = await this.giangDayService.exportMauNhapDiemLopHocPhan(id, userId, vaiTro);
    // Tên file theo mã lớp học phần (không dùng id). ASCII trong header, UTF-8 cho trình duyệt.
    const filenameAscii = `Mau-nhap-diem-LHP-${maLopHocPhan}.xlsx`;
    const filenameUtf8 = `Mẫu nhập điểm LHP ${maLopHocPhan}.xlsx`;
    const contentDisposition = `attachment; filename="${filenameAscii}"; filename*=UTF-8''${encodeURIComponent(filenameUtf8)}`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', contentDisposition);
    res.send(buffer);
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

  @Post('len-ke-hoach-tao-lhp/json')
  @ApiBearerAuth()
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @ApiOperation({ summary: 'Lên kế hoạch tạo LHP (JSON)' })
  async lenKeHoachTaoLhpJson(
    @Body() dto: LenKeHoachTaoLhpDto,
  ) {
    return this.giangDayService.lenKeHoachTaoLhpJson(
      dto.maNamHoc,
      dto.hocKy,
    );
  }

  @Post('lop-hoc-phan/import-tu-json')
  @ApiBearerAuth()
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @ApiOperation({
    summary: 'Import hàng loạt lớp học phần từ JSON',
    description: `Nhập danh sách lớp học phần dưới dạng JSON, 
mỗi phần tử bao gồm: maLopHocPhan, ghiChu?, maNganh, maNienKhoa, maMonHoc, maNamHoc, hocKy, maGiangVien?, soSinhVienSeThamGia?`,
  })
  @ApiBody({
    type: ImportLopHocPhanJsonDto,
  })
  @ApiResponse({ status: 200, description: 'Kết quả import lớp học phần từ JSON' })
  async importLopHocPhanTuJson(
    @Body() dto: ImportLopHocPhanJsonDto,
  ) {
    return this.giangDayService.importLopHocPhanTuJson(dto.lopHocPhans);
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
3. Thêm tối đa 40 sinh viên chưa học môn này vào lớp`,
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

  /* ==================== ĐỀ XUẤT LỚP HỌC PHẦN CHO HỌC LẠI ==================== */

  @ApiOperation({
    summary: 'Lấy thông tin lớp học phần đề xuất cần tạo cho sinh viên trượt môn',
    description:
      'Lấy danh sách lớp học phần đề xuất cần tạo cho sinh viên trượt môn trong trường hợp không còn lớp học phần nào khả thi. ' +
      'Hệ thống sẽ tự động: ' +
      '1. Lấy tất cả sinh viên trượt môn trong năm học và học kỳ đó ' +
      '2. Nhóm theo môn học ' +
      '3. Sàng lọc sinh viên thực sự cần học lại (loại bỏ những người đã học lại thành công hoặc đang học lại) ' +
      '4. Loại bỏ những sinh viên có lớp học phần khả thi có thể tham gia ' +
      '5. Nhóm sinh viên theo ngành, niên khóa và tạo đề xuất lớp học phần (tối thiểu 1 sinh viên, tối đa 40 sinh viên mỗi lớp) ' +
      '6. Phân công giảng viên dựa trên tải tín chỉ hiện tại',
  })
  @ApiParam({ name: 'ma-nam-hoc', required: true, type: String, description: 'Mã năm học (ví dụ: NH2023)' })
  @ApiParam({ name: 'hocKy', required: true, type: Number, description: 'Học kỳ (ví dụ: 1)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách lớp học phần đề xuất cần tạo',
    type: GetDeXuatLopHocPhanChoHocLaiResponseDto,
  })
  @Get('de-xuat-lop-hoc-phan-cho-hoc-lai/nam-hoc/:maNamHoc/hoc-ky/:hocKy')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getDeXuatLopHocPhanChoHocLai(
    @Param('maNamHoc') maNamHoc: string,
    @Param('hocKy', ParseIntPipe) hocKy: number,
  ): Promise<GetDeXuatLopHocPhanChoHocLaiResponseDto> {
    return this.giangDayService.getDeXuatLopHocPhanChoHocLai(maNamHoc, hocKy);
  }

  @ApiOperation({
    summary: 'Tạo lớp học phần cho sinh viên trượt môn',
    description:
      'Tạo lớp học phần cho sinh viên trượt môn trong trường hợp không còn lớp học phần nào khả thi. ' +
      'API này chỉ tạo lớp học phần, không tự động thêm sinh viên vào lớp (cần sử dụng chức năng riêng để thêm sinh viên). ' +
      'Validation đầy đủ: ' +
      '1. Kiểm tra môn học, ngành, niên khóa, học kỳ tồn tại ' +
      '2. Kiểm tra giảng viên được phân công dạy môn này ' +
      '3. Kiểm tra tải tín chỉ của giảng viên không vượt quá 12 tín chỉ ' +
      '4. Kiểm tra mã lớp học phần chưa tồn tại',
  })
  @ApiBody({ type: TaoLopHocPhanChoHocLaiDto })
  @ApiResponse({
    status: 201,
    description: 'Lớp học phần đã được tạo thành công',
  })
  @Post('tao-lop-hoc-phan-cho-hoc-lai')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.CREATED)
  async taoLopHocPhanChoHocLai(
    @Body() dto: TaoLopHocPhanChoHocLaiDto,
  ) {
    return this.giangDayService.taoLopHocPhanChoHocLai(dto);
  }

  /* ==================== ĐỀ XUẤT LỚP HỌC PHẦN CHO HỌC BỔ SUNG VÀ HỌC CẢI THIỆN ==================== */

  @ApiOperation({
    summary: 'Lấy thông tin lớp học phần đề xuất cần tạo cho sinh viên học bổ sung và học cải thiện',
    description:
      'Lấy danh sách lớp học phần đề xuất cần tạo cho sinh viên học bổ sung và học cải thiện trong trường hợp không có lớp học phần nào phù hợp để học ghép. ' +
      'Hệ thống sẽ tự động: ' +
      '1. Lấy tất cả yêu cầu học phần có trạng thái DANG_XU_LY ' +
      '2. Lọc ra những yêu cầu không có lớp học phần đề xuất (lopHocPhanDeXuat: []) ' +
      '3. Nhóm theo môn học ' +
      '4. Với mỗi môn học, lấy tối đa 40 sinh viên (nếu có dưới 40 thì lấy hết, còn trên 40 thì lấy 40) ' +
      '5. Nhóm sinh viên theo ngành, niên khóa và tạo đề xuất lớp học phần (tối đa 40 sinh viên mỗi lớp) ' +
      '6. Sử dụng học kỳ mới nhất (học kỳ lớn nhất của năm học có năm bắt đầu lớn nhất) ' +
      '7. Phân công giảng viên dựa trên tải tín chỉ hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách lớp học phần đề xuất cần tạo',
    type: GetDeXuatLopHocPhanChoHocBoSungCaiThienResponseDto,
  })
  @Get('de-xuat-lop-hoc-phan-cho-hoc-bo-sung-cai-thien')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getDeXuatLopHocPhanChoHocBoSungCaiThien(): Promise<GetDeXuatLopHocPhanChoHocBoSungCaiThienResponseDto> {
    return this.giangDayService.getDeXuatLopHocPhanChoHocBoSungCaiThien();
  }

  @ApiOperation({
    summary: 'Tạo lớp học phần cho sinh viên học bổ sung và học cải thiện',
    description:
      'Tạo lớp học phần cho sinh viên học bổ sung và học cải thiện trong trường hợp không còn lớp học phần nào khả thi. ' +
      'API này chỉ tạo lớp học phần, không tự động thêm sinh viên vào lớp (cần sử dụng chức năng riêng để thêm sinh viên). ' +
      'Validation đầy đủ: ' +
      '1. Kiểm tra môn học, ngành, niên khóa, học kỳ tồn tại ' +
      '2. Kiểm tra giảng viên được phân công dạy môn này ' +
      '3. Kiểm tra tải tín chỉ của giảng viên không vượt quá 12 tín chỉ ' +
      '4. Kiểm tra mã lớp học phần chưa tồn tại',
  })
  @ApiBody({ type: TaoLopHocPhanChoHocBoSungCaiThienDto })
  @ApiResponse({
    status: 201,
    description: 'Lớp học phần đã được tạo thành công',
  })
  @Post('tao-lop-hoc-phan-cho-hoc-bo-sung-cai-thien')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.CREATED)
  async taoLopHocPhanChoHocBoSungCaiThien(
    @Body() dto: TaoLopHocPhanChoHocBoSungCaiThienDto,
  ) {
    return this.giangDayService.taoLopHocPhanChoHocBoSungCaiThien(dto);
  }

  /* ==================== YÊU CẦU HỌC PHẦN ==================== */

  @ApiOperation({
    summary: 'Lấy danh sách tất cả yêu cầu học phần (có phân trang, bộ lọc và tìm kiếm)',
    description:
      'Lấy danh sách tất cả yêu cầu học phần, chia thành 5 loại: chờ duyệt, đang xử lý, đã duyệt, từ chối, đã hủy. ' +
      'Đối với yêu cầu chờ duyệt và đang xử lý, hệ thống sẽ đề xuất lớp học phần tốt nhất dựa trên các tiêu chí ưu tiên. ' +
      'Hỗ trợ phân trang, lọc theo trạng thái, loại yêu cầu và tìm kiếm theo mã sinh viên hoặc tên sinh viên.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang số (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số mục trên trang (mặc định: 10)' })
  @ApiQuery({ name: 'trangThai', required: false, enum: ['CHO_DUYET', 'DANG_XU_LY', 'DA_DUYET', 'TU_CHOI', 'DA_HUY'], description: 'Lọc theo trạng thái' })
  @ApiQuery({ name: 'loaiYeuCau', required: false, enum: ['HOC_CAI_THIEN', 'HOC_BO_SUNG'], description: 'Lọc theo loại yêu cầu' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Tìm kiếm theo mã sinh viên hoặc tên sinh viên' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách yêu cầu học phần',
    type: GetDanhSachYeuCauHocPhanPaginatedResponseDto,
  })
  @Get('yeu-cau-hoc-phan')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getDanhSachYeuCauHocPhan(
    @Query() query: GetDanhSachYeuCauHocPhanQueryDto,
  ): Promise<GetDanhSachYeuCauHocPhanResponseDto | GetDanhSachYeuCauHocPhanPaginatedResponseDto> {
    return this.giangDayService.getDanhSachYeuCauHocPhan(query);
  }

  @ApiOperation({
    summary: 'Chuyển trạng thái yêu cầu sang DANG_XU_LY',
    description: 'Chuyển trạng thái yêu cầu từ CHO_DUYET sang DANG_XU_LY để tránh xung đột khi xử lý',
  })
  @ApiResponse({
    status: 200,
    description: 'Chuyển trạng thái thành công',
  })
  @Post('yeu-cau-hoc-phan/chuyen-trang-thai-dang-xu-ly')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.OK)
  async chuyenTrangThaiDangXuLy(@Body() dto: ChuyenTrangThaiDangXuLyDto): Promise<void> {
    return this.giangDayService.chuyenTrangThaiDangXuLy(dto.yeuCauId);
  }

  @ApiOperation({
    summary: 'Duyệt yêu cầu học phần',
    description: 'Duyệt yêu cầu học phần và gán sinh viên vào lớp học phần được duyệt',
  })
  @ApiResponse({
    status: 200,
    description: 'Duyệt yêu cầu thành công',
  })
  @Post('yeu-cau-hoc-phan/duyet')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.OK)
  async duyetYeuCauHocPhan(
    @Body() dto: DuyetYeuCauHocPhanDto,
    @GetUser('userId') userId: number,
  ): Promise<void> {
    return this.giangDayService.duyetYeuCauHocPhan(
      dto.yeuCauId,
      dto.lopHocPhanId,
      userId,
      dto.ghiChuPhongDaoTao,
    );
  }

  @ApiOperation({
    summary: 'Từ chối yêu cầu học phần',
    description: 'Từ chối yêu cầu học phần của sinh viên',
  })
  @ApiResponse({
    status: 200,
    description: 'Từ chối yêu cầu thành công',
  })
  @Post('yeu-cau-hoc-phan/tu-choi')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.OK)
  async tuChoiYeuCauHocPhan(
    @Body() dto: TuChoiYeuCauHocPhanDto,
    @GetUser('userId') userId: number,
  ): Promise<void> {
    return this.giangDayService.tuChoiYeuCauHocPhan(dto.yeuCauId, userId, dto.ghiChuPhongDaoTao);
  }

  @ApiOperation({
    summary: 'Xóa yêu cầu học phần',
    description: 'Xóa yêu cầu học phần (chỉ có thể xóa yêu cầu có trạng thái DA_HUY)',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa yêu cầu thành công',
  })
  @Delete('yeu-cau-hoc-phan/:yeuCauId')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.OK)
  async xoaYeuCauHocPhan(@Param('yeuCauId', ParseIntPipe) yeuCauId: number): Promise<void> {
    return this.giangDayService.xoaYeuCauHocPhan(yeuCauId);
  }

}