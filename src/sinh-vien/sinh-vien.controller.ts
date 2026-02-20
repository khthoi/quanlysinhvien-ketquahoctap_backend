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
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { SinhVienService } from './sinh-vien.service';
import { CreateSinhVienDto } from './dtos/create-sinh-vien.dto';
import { UpdateSinhVienDto, UpdateSinhVienSelfDto } from './dtos/update-sinh-vien.dto';
import { GetSinhVienQueryDto } from './dtos/get-sinh-vien-query.dto';
import { GetKhenThuongKyLuatFilterDto, KhenThuongKyLuatDto } from './dtos/khen-thuong-ky-luat.dto';
import { PhanLopDto } from './dtos/phan-lop.dto';
import { ThayDoiTinhTrangDto } from './dtos/thay-doi-tinh-trang.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { VaiTroNguoiDungEnum } from 'src/auth/enums/vai-tro-nguoi-dung.enum';
import { GetLichHocMeQueryDto } from './dtos/get-lich-hoc-me-query.dto';
import { ImportSinhVienBatchDto } from './dtos/import-sinh-vien.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import express from 'express';
import {
  XetTotNghiepDto,
  DuDoanXetTotNghiepResponseDto,
  XacNhanXetTotNghiepResponseDto,
  DanhSachTotNghiepResponseDto,
} from './dtos/xet-tot-nghiep.dto';
import { LoaiYeuCauHocPhanEnum } from 'src/giang-day/enums/yeu-cau-hoc-phan.enum';
import { SuaYeuCauHocPhanDto } from './dtos/cap-nhat-yeu-cau-hoc-phan.dto';
import { GetYeuCauDangKyQueryDto } from './dtos/get-yeu-cau-dang-ky-query.dto';
import { GetYeuCauDangKyMeResponseDto, GetYeuCauDangKyResponseDto } from './dtos/get-yeu-cau-dang-ky-response.dto';

@ApiTags('Sinh viên')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Chưa đăng nhập hoặc token hết hạn' })
@ApiForbiddenResponse({ description: 'Không có quyền truy cập' })
@Controller('sinh-vien')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SinhVienController {
  constructor(private readonly sinhVienService: SinhVienService) { }

  /* ==================== QUẢN LÝ SINH VIÊN (Cán bộ phòng Đào tạo) ==================== */

  @ApiOperation({ summary: 'Tạo sinh viên mới' })
  @ApiBody({ type: CreateSinhVienDto })
  @ApiResponse({ status: 201, description: 'Sinh viên đã được tạo thành công' })
  @Post()
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async create(@Body() dto: CreateSinhVienDto) {
    return this.sinhVienService.create(dto);
  }

  @Post('import')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO, VaiTroNguoiDungEnum.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp', // tạo thư mục nếu chưa có
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(xlsx|xls|csv)$/)) {
          return cb(new BadRequestException('Chỉ chấp nhận file Excel (.xlsx, .xls, .csv)'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  @ApiOperation({ summary: 'Nhập danh sách sinh viên hàng loạt từ file Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File Excel chứa danh sách sinh viên',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Kết quả nhập liệu' })
  async importSinhVien(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Không có file được tải lên');
    }

    return this.sinhVienService.importFromExcel(file.path);
  }

  @ApiOperation({ summary: 'Lấy danh sách sinh viên (có lọc theo lớp, ngành, niên khóa và phân trang)' })
  @ApiQuery({ name: 'lopId', required: false, type: Number })
  @ApiQuery({ name: 'nganhId', required: false, type: Number })
  @ApiQuery({ name: 'nienKhoaId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách sinh viên' })
  @Get()
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async findAll(@Query() query: GetSinhVienQueryDto) {
    return this.sinhVienService.findAll(query);
  }

  @ApiOperation({ summary: 'Lấy thông tin chi tiết một sinh viên' })
  @ApiParam({ name: 'id', type: Number, description: 'ID sinh viên' })
  @ApiResponse({ status: 200, description: 'Thông tin sinh viên' })
  @Get(':id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sinhVienService.findOne(id);
  }

  @ApiOperation({ summary: 'Cập nhật thông tin sinh viên' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateSinhVienDto })
  @ApiResponse({ status: 200, description: 'Thông tin sinh viên đã được cập nhật' })
  @Put(':id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSinhVienDto,
  ) {
    return this.sinhVienService.update(id, dto);
  }

  @ApiOperation({ summary: 'Xóa một sinh viên' })
  @ApiParam({ name: 'id', type: Number, description: 'ID sinh viên' })
  @ApiResponse({ status: 200, description: 'Xóa sinh viên và tài khoản thành công' })
  @Delete(':id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.sinhVienService.remove(id);
  }

  @ApiOperation({ summary: 'Thay đổi tình trạng học tập của sinh viên (bảo lưu, nghỉ học, trở lại...)' })
  @ApiParam({ name: 'sinhvien_id', type: Number })
  @ApiBody({ type: ThayDoiTinhTrangDto })
  @ApiResponse({ status: 200, description: 'Tình trạng đã được cập nhật' })
  @Patch('tinh-trang/:sinhvien_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async thayDoiTinhTrang(
    @Param('sinhvien_id', ParseIntPipe) sinhvien_id: number,
    @Body() dto: ThayDoiTinhTrangDto,
  ) {
    return this.sinhVienService.thayDoiTinhTrang(sinhvien_id, dto);
  }

  @ApiOperation({ summary: 'Phân lớp cho sinh viên (chuyển lớp, thay đổi lớp)' })
  @ApiParam({ name: 'sinhvien_id', type: Number })
  @ApiBody({ type: PhanLopDto })
  @ApiResponse({ status: 200, description: 'Phân lớp thành công' })
  @Patch('phan-lop/:sinhvien_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async phanLop(
    @Param('sinhvien_id', ParseIntPipe) sinhvien_id: number,
    @Body() dto: PhanLopDto,
  ) {
    return this.sinhVienService.phanLop(sinhvien_id, dto);
  }

  @ApiOperation({ summary: 'Thêm khen thưởng hoặc kỷ luật cho sinh viên' })
  @ApiParam({ name: 'sinhvien_id', type: Number })
  @ApiBody({ type: KhenThuongKyLuatDto })
  @ApiResponse({ status: 201, description: 'Khen thưởng/kỷ luật đã được thêm' })
  @Post('khen-thuong/:sinhvien_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async themKhenThuong(
    @Param('sinhvien_id', ParseIntPipe) sinhvien_id: number,
    @Body() dto: KhenThuongKyLuatDto,
  ) {
    return this.sinhVienService.themKhenThuongKyLuat(sinhvien_id, dto);
  }

  @ApiOperation({ summary: 'Xóa một bản ghi khen thưởng/kỷ luật' })
  @ApiParam({ name: 'id', type: Number, description: 'ID bản ghi khen thưởng/kỷ luật' })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @Delete('khen-thuong/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async xoaKhenThuong(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.sinhVienService.xoaKhenThuongKyLuat(id);
  }

  @ApiOperation({ summary: 'Thêm kỷ luật cho sinh viên (tương tự khen thưởng nhưng loại khác)' })
  @ApiParam({ name: 'sinhvien_id', type: Number })
  @ApiBody({ type: KhenThuongKyLuatDto })
  @ApiResponse({ status: 201, description: 'Kỷ luật đã được thêm' })
  @Post('ky-luat/:sinhvien_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async themKyLuat(
    @Param('sinhvien_id', ParseIntPipe) sinhvien_id: number,
    @Body() dto: KhenThuongKyLuatDto,
  ) {
    return this.sinhVienService.themKhenThuongKyLuat(sinhvien_id, dto);
  }

  @ApiOperation({ summary: 'Xóa một bản ghi kỷ luật' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @Delete('ky-luat/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async xoaKyLuat(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.sinhVienService.xoaKhenThuongKyLuat(id);
  }

  @ApiOperation({ summary: 'Lấy danh sách thành tích (khen thưởng + kỷ luật) của sinh viên' })
  @ApiParam({ name: 'sinhvien_id', type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách thành tích và kỷ luật' })
  @Get('thanh-tich/:sinhvien_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getThanhTich(@Query() query: GetKhenThuongKyLuatFilterDto, @Param('sinhvien_id', ParseIntPipe) sinhvien_id: number) {
    return this.sinhVienService.getThanhTich(sinhvien_id, query);
  }

  /* ==================== SINH VIÊN TỰ XEM THÔNG TIN ==================== */

  @ApiOperation({
    summary: 'Sinh viên xem thông tin cá nhân của mình',
    description: 'Chỉ sinh viên đang đăng nhập mới được gọi',
  })
  @ApiResponse({ status: 200, description: 'Thông tin cá nhân của sinh viên' })
  @Get('me/my-profile')
  @Roles(VaiTroNguoiDungEnum.SINH_VIEN)
  async getMe(@GetUser('userId') userId: number) {
    return this.sinhVienService.findMe(userId);
  }

  //@ApiOperation({
  //summary: 'Sinh viên cập nhật thông tin cá nhân của mình',
  //description: 'Chỉ sinh viên đang đăng nhập mới được gọi',
  //})
  //@ApiBody({ type: UpdateSinhVienSelfDto })
  //@ApiResponse({ status: 200, description: 'Thông tin cá nhân đã được cập nhật' })
  //@Put('me/my-profile')
  //@Roles(VaiTroNguoiDungEnum.SINH_VIEN)
  //async updateMe(
  //@GetUser('userId') userId: number,
  //@Body() dto: UpdateSinhVienSelfDto,
  //) {
  //  return this.sinhVienService.updateMe(userId, dto);
  //}

  /* ==================== XÉT TỐT NGHIỆP APIs ==================== */

  @ApiOperation({
    summary: 'Dự đoán xét tốt nghiệp theo niên khóa (Preview)',
    description: `Lấy danh sách tất cả sinh viên CHƯA tốt nghiệp trong niên khóa và đánh giá điều kiện tốt nghiệp của họ.
KHÔNG thay đổi trạng thái sinh viên.
Trả về JSON chứa:
- Thống kê tổng quan (số đạt, không đạt, không đủ điều kiện)
- Thống kê theo từng ngành
- Danh sách chi tiết sinh viên với GPA, kết quả xét, xếp loại, lý do không đạt (nếu có)`,
  })
  @ApiBody({ type: XetTotNghiepDto })
  @ApiResponse({
    status: 200,
    description: 'Thông tin dự đoán xét tốt nghiệp',
    type: DuDoanXetTotNghiepResponseDto,
  })
  @Post('xet-tot-nghiep/du-doan')
  @Roles(VaiTroNguoiDungEnum.ADMIN, VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async duDoanXetTotNghiep(@Body() dto: XetTotNghiepDto) {
    return this.sinhVienService.duDoanXetTotNghiep(dto);
  }

  @ApiOperation({
    summary: 'Xác nhận xét tốt nghiệp theo niên khóa',
    description: `Xét tốt nghiệp cho tất cả sinh viên đủ điều kiện trong niên khóa.
CẬP NHẬT trạng thái sinh viên đạt thành DA_TOT_NGHIEP.
Trả về JSON chứa:
- Thống kê kết quả xét
- Thống kê theo từng ngành
- Danh sách sinh viên đã được cập nhật tình trạng tốt nghiệp`,
  })
  @ApiBody({ type: XetTotNghiepDto })
  @ApiResponse({
    status: 200,
    description: 'Kết quả xét tốt nghiệp',
    type: XacNhanXetTotNghiepResponseDto,
  })
  @Post('xet-tot-nghiep/xac-nhan')
  @Roles(VaiTroNguoiDungEnum.ADMIN, VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async xacNhanXetTotNghiep(@Body() dto: XetTotNghiepDto) {
    return this.sinhVienService.xacNhanXetTotNghiep(dto.nienKhoaId);
  }

  @ApiOperation({
    summary: 'Lấy danh sách sinh viên đã tốt nghiệp theo niên khóa (có phân trang & bộ lọc)',
    description: `Lấy danh sách tất cả sinh viên có trạng thái DA_TOT_NGHIEP trong niên khóa, có thể lọc theo xếp loại, mã lớp, mã ngành và phân trang.
Trả về JSON chứa:
- Tổng số sinh viên tốt nghiệp
- Thống kê theo từng ngành (số lượng, xếp loại)
- Danh sách chi tiết sinh viên với thông tin cơ bản, GPA, xếp loại tốt nghiệp (sau khi áp dụng bộ lọc & phân trang)`,
  })
  @ApiBody({ type: XetTotNghiepDto })
  @ApiResponse({
    status: 200,
    description: 'Danh sách sinh viên đã tốt nghiệp',
    type: DanhSachTotNghiepResponseDto,
  })
  @Post('xet-tot-nghiep/danh-sach')
  @Roles(VaiTroNguoiDungEnum.ADMIN, VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getDanhSachTotNghiep(@Body() dto: XetTotNghiepDto) {
    return this.sinhVienService.getDanhSachTotNghiep(dto);
  }

  @ApiOperation({
    summary: 'Xuất Excel danh sách sinh viên đã tốt nghiệp theo niên khóa',
    description: `Xuất file Excel danh sách sinh viên đã tốt nghiệp (DA_TOT_NGHIEP) trong niên khóa.
KHÔNG có logic xét tốt nghiệp - chỉ xuất những sinh viên đã được xét tốt nghiệp trước đó.`,
  })
  @ApiBody({ type: XetTotNghiepDto })
  @ApiResponse({
    status: 200,
    description: 'File Excel danh sách sinh viên tốt nghiệp',
    content: {
      'application/vnd.openxmlformats-officedocument. spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('xet-tot-nghiep/xuat-excel')
  @Roles(VaiTroNguoiDungEnum.ADMIN, VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async xuatExcelTotNghiep(
    @Body() dto: XetTotNghiepDto,
    @Res() res: express.Response,
  ) {
    const buffer = await this.sinhVienService.xetTotNghiepVaXuatExcel(
      dto.nienKhoaId,
    );

    const fileName = `DanhSach_SinhVien_TotNghiep_${Date.now()}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    );

    res.send(buffer);
  }

  @ApiOperation({
    summary: 'Sinh viên xem lịch học cá nhân',
    description: 'Lịch các lớp học phần mà sinh viên đang đăng ký, có thể lọc theo học kỳ/năm học',
  })
  @ApiQuery({ name: 'hocKyId', required: false, type: Number })
  @ApiQuery({ name: 'namHocId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lịch học của sinh viên' })
  @Get('lich-hoc/me')
  @Roles(VaiTroNguoiDungEnum.SINH_VIEN)
  async getLichHocMe(
    @GetUser('userId') userId: number,
    @Query() query: GetLichHocMeQueryDto,
  ) {
    return this.sinhVienService.getLichHocMe(userId, query);
  }

  /* ==================== YÊU CẦU ĐĂNG KÝ HỌC CẢI THIỆN / BỔ SUNG ==================== */

  @ApiOperation({
    summary: 'Sinh viên xem danh sách yêu cầu đăng ký của mình (có phân trang và bộ lọc)',
    description: 'Lấy danh sách yêu cầu đăng ký học phần của sinh viên hiện tại (từ token) với phân trang, có thể lọc theo trạng thái và loại yêu cầu',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang số (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số mục trên trang (mặc định: 10)' })
  @ApiQuery({ name: 'trangThai', required: false, enum: ['CHO_DUYET', 'DANG_XU_LY', 'DA_DUYET', 'TU_CHOI', 'DA_HUY'], description: 'Lọc theo trạng thái' })
  @ApiQuery({ name: 'loaiYeuCau', required: false, enum: ['HOC_CAI_THIEN', 'HOC_BO_SUNG'], description: 'Lọc theo loại yêu cầu' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách yêu cầu đăng ký với phân trang',
    type: GetYeuCauDangKyMeResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Tài khoản được liên kết với giảng viên hoặc không được liên kết với sinh viên nào',
  })
  @Get('yeu-cau-dang-ky/me')
  @Roles(VaiTroNguoiDungEnum.SINH_VIEN)
  async getYeuCauDangKyMe(
    @GetUser('userId') userId: number,
    @Query() query: GetYeuCauDangKyQueryDto,
  ): Promise<GetYeuCauDangKyMeResponseDto> {
    return this.sinhVienService.getYeuCauDangKyMe(userId, query);
  }

  @ApiOperation({
    summary: 'Sinh viên gửi yêu cầu đăng ký học cải thiện / học bổ sung',
    description:
      'Sinh viên gửi yêu cầu đăng ký học cải thiện hoặc học bổ sung cho một môn học trong CTĐT. Hệ thống sẽ kiểm tra CTĐT, kết quả học tập, lộ trình học kỳ và các yêu cầu đã gửi trước đó.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        monHocId: { type: 'number', description: 'ID môn học' },
        loaiYeuCau: {
          type: 'string',
          enum: Object.values(LoaiYeuCauHocPhanEnum),
          description: 'Loại yêu cầu: HOC_CAI_THIEN hoặc HOC_BO_SUNG',
        },
        lyDo: { type: 'string', nullable: true, description: 'Lý do gửi yêu cầu' },
      },
      required: ['monHocId', 'loaiYeuCau'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Yêu cầu đăng ký học phần đã được tạo và chờ xét duyệt',
  })
  @Post('yeu-cau-dang-ky/me')
  @Roles(VaiTroNguoiDungEnum.SINH_VIEN)
  async taoYeuCauDangKyHocPhan(
    @GetUser('userId') userId: number,
    @Body()
    body: {
      monHocId: number;
      loaiYeuCau: LoaiYeuCauHocPhanEnum;
      lyDo?: string;
    },
  ) {
    const sinhVienId = await this.sinhVienService.getSinhVienIdFromUserId(userId);
    return this.sinhVienService.taoYeuCauDangKyHocPhan(sinhVienId, body);
  }

  @ApiOperation({
    summary: 'Sửa yêu cầu học phần',
    description: 'Sửa yêu cầu học phần (chỉ có thể sửa yêu cầu có trạng thái CHO_DUYET)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sửa yêu cầu thành công',
  })
  @Put('yeu-cau-hoc-phan/me')
  @Roles(VaiTroNguoiDungEnum.SINH_VIEN)
  @HttpCode(HttpStatus.OK)
  async suaYeuCauHocPhan(
    @GetUser('userId') userId: number,
    @Body() dto: SuaYeuCauHocPhanDto,
  ): Promise<void> {
    const sinhVienId = await this.sinhVienService.getSinhVienIdFromUserId(userId);
    return this.sinhVienService.suaYeuCauHocPhan(sinhVienId, dto.yeuCauId, {
      monHocId: dto.monHocId,
      loaiYeuCau: dto.loaiYeuCau,
      ketQuaCuId: dto.ketQuaCuId,
      lyDo: dto.lyDo,
    });
  }

  @ApiOperation({
    summary: 'Xóa yêu cầu học phần',
    description: 'Xóa yêu cầu học phần (chỉ có thể xóa yêu cầu có trạng thái CHO_DUYET hoặc DA_HUY)',
  })
  @ApiParam({ name: 'yeuCauId', type: Number, description: 'ID yêu cầu học phần' })
  @ApiResponse({
    status: 200,
    description: 'Xóa yêu cầu thành công',
  })
  @Delete('yeu-cau-hoc-phan/me/:yeuCauId')
  @Roles(VaiTroNguoiDungEnum.SINH_VIEN)
  @HttpCode(HttpStatus.OK)
  async xoaYeuCauHocPhan(
    @GetUser('userId') userId: number,
    @Param('yeuCauId', ParseIntPipe) yeuCauId: number,
  ): Promise<void> {
    const sinhVienId = await this.sinhVienService.getSinhVienIdFromUserId(userId);
    return this.sinhVienService.xoaYeuCauHocPhan(sinhVienId, yeuCauId);
  }

  @ApiOperation({
    summary: 'Hủy yêu cầu học phần',
    description: 'Hủy yêu cầu học phần (chỉ có thể hủy yêu cầu có trạng thái CHO_DUYET, trạng thái sẽ chuyển thành DA_HUY)',
  })
  @ApiParam({ name: 'yeuCauId', type: Number, description: 'ID yêu cầu học phần' })
  @ApiResponse({
    status: 200,
    description: 'Hủy yêu cầu thành công',
  })
  @Put('yeu-cau-hoc-phan/me/:yeuCauId/huy')
  @Roles(VaiTroNguoiDungEnum.SINH_VIEN)
  @HttpCode(HttpStatus.OK)
  async huyYeuCauHocPhan(
    @GetUser('userId') userId: number,
    @Param('yeuCauId', ParseIntPipe) yeuCauId: number,
  ): Promise<void> {
    const sinhVienId = await this.sinhVienService.getSinhVienIdFromUserId(userId);
    return this.sinhVienService.huyYeuCauHocPhan(sinhVienId, yeuCauId);
  }
}