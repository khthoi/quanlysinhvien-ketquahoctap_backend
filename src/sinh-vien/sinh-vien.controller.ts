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

  @ApiOperation({
    summary: 'Sinh viên cập nhật thông tin cá nhân của mình',
    description: 'Chỉ sinh viên đang đăng nhập mới được gọi',
  })
  @ApiBody({ type: UpdateSinhVienSelfDto })
  @ApiResponse({ status: 200, description: 'Thông tin cá nhân đã được cập nhật' })
  @Put('me/my-profile')
  @Roles(VaiTroNguoiDungEnum.SINH_VIEN)
  async updateMe(
    @GetUser('userId') userId: number,
    @Body() dto: UpdateSinhVienSelfDto,
  ) {
    return this.sinhVienService.updateMe(userId, dto);
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
}