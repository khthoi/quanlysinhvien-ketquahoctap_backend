import {
  Controller,
  Post,
  Put,
  Get,
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
import { KetQuaService } from './ket-qua.service';
import { NhapDiemDto, SuaDiemDto } from './dtos/nhap-diem.dto';
import { GetKetQuaLopQueryDto } from './dtos/get-ket-qua-lop-query.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { VaiTroNguoiDungEnum } from 'src/auth/enums/vai-tro-nguoi-dung.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Kết quả học tập')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Chưa đăng nhập hoặc token hết hạn' })
@ApiForbiddenResponse({ description: 'Không có quyền truy cập' })
@Controller('ket-qua')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KetQuaController {
  constructor(private readonly ketQuaService: KetQuaService) { }

  @ApiOperation({
    summary: 'Nhập điểm cho sinh viên trong lớp học phần',
    description:
      'Chỉ giảng viên hoặc cán bộ phòng Đào tạo được phép nhập điểm. Body phải chứa lopHocPhanId, sinhVienId và các trường điểm.',
  })
  @ApiBody({
    type: NhapDiemDto,
    description:
      'Ngoài các trường điểm, cần thêm lopHocPhanId và sinhVienId vào body',
  })
  @ApiResponse({ status: 201, description: 'Nhập điểm thành công' })
  @Post('nhap-diem')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO, VaiTroNguoiDungEnum.GIANG_VIEN)
  @ApiOperation({ summary: 'Nhập điểm cho sinh viên trong lớp học phần' })
  @ApiBody({
    type: NhapDiemDto,
    description:
      'Cần lopHocPhanId, sinhVienId và các trường điểm. Giảng viên chỉ được nhập cho lớp mình phụ trách.',
  })
  @ApiResponse({ status: 201, description: 'Nhập điểm thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền nhập điểm cho lớp này' })
  async nhapDiem(
    @GetUser('userId') userId: number, // ← Lấy userId từ JWT
    @Body() dto: NhapDiemDto,
  ) {
    return this.ketQuaService.nhapDiem(userId, dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Sửa điểm của một bản ghi kết quả',
    description: 'Chỉ giảng viên phụ trách lớp học phần đó được phép sửa điểm đã nhập. Cán bộ phòng đào tạo cũng có quyền sửa.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID của bản ghi kết quả học tập' })
  @ApiBody({ type: SuaDiemDto, description: 'Các trường điểm cần sửa' })
  @ApiResponse({ status: 200, description: 'Điểm đã được cập nhật thành công' })
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO, VaiTroNguoiDungEnum.GIANG_VIEN)
  async suaDiem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SuaDiemDto,
    @GetUser('userId') userId: number, // ← Lấy userId từ token JWT
  ) {
    return this.ketQuaService.suaDiem(id, dto, userId);
  }

  @ApiOperation({
    summary: 'Lấy danh sách điểm của toàn bộ lớp học phần',
    description: 'Chỉ cán bộ phòng Đào tạo và giảng viên phụ trách lớp học phần được xem',
  })
  @ApiParam({
    name: 'lop_hoc_phan_id',
    type: Number,
    description: 'ID lớp học phần',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang hiện tại' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số bản ghi mỗi trang' })
  @ApiResponse({ status: 200, description: 'Danh sách điểm của lớp học phần' })
  @Get('lop-hoc-phan/:lop_hoc_phan_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO, VaiTroNguoiDungEnum.GIANG_VIEN)
  @ApiOperation({
    summary: 'Lấy danh sách điểm của toàn bộ lớp học phần',
    description: 'Chỉ cán bộ phòng Đào tạo và giảng viên phụ trách lớp học phần được xem',
  })
  @ApiParam({ name: 'lop_hoc_phan_id', type: Number, description: 'ID lớp học phần' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang hiện tại' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số bản ghi mỗi trang' })
  @ApiResponse({ status: 200, description: 'Danh sách điểm của lớp học phần' })
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO, VaiTroNguoiDungEnum.GIANG_VIEN)
  async getDanhSachDiemLop(
    @Param('lop_hoc_phan_id', ParseIntPipe) lopHocPhanId: number,
    @GetUser('userId') userId: number,          // ← Lấy userId từ token
    @GetUser('vaiTro') vaiTro: VaiTroNguoiDungEnum, // ← Lấy vai trò từ token
    @Query() query: GetKetQuaLopQueryDto,
  ) {
    return this.ketQuaService.getDanhSachDiemLop(lopHocPhanId, userId, vaiTro, query);
  }

  @Post('nhap-diem-excel/:lop_hoc_phan_id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO, VaiTroNguoiDungEnum.GIANG_VIEN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp', // thư mục tạm
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(xlsx)$/)) {
          return cb(new BadRequestException('Chỉ chấp nhận file .xlsx'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  @ApiOperation({ summary: 'Nhập điểm cho lớp học phần bằng file Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'lop_hoc_phan_id', type: Number, description: 'ID lớp học phần' })
  @ApiBody({
    description: 'File Excel (.xlsx) với cột: STT (bỏ qua), Mã sinh viên, Họ tên (bỏ qua), Giới tính (bỏ qua), Điểm chuyên cần, Điểm thành phần, Điểm thi',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Kết quả nhập điểm từ Excel' })
  async nhapDiemExcel(
    @Param('lop_hoc_phan_id', ParseIntPipe) lopHocPhanId: number,
    @GetUser('userId') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Không có file được tải lên');
    }

    return this.ketQuaService.nhapDiemExcel(lopHocPhanId, userId, file.path);
  }


  @ApiOperation({
    summary: 'Sinh viên xem kết quả học tập của chính mình',
    description: 'Chỉ sinh viên đang đăng nhập mới được gọi endpoint này',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách các môn học và điểm của sinh viên',
  })
  @Get('sinh-vien/me')
  @Roles(VaiTroNguoiDungEnum.SINH_VIEN)
  async getKetQuaCuaToi(@GetUser('userId') userId: number) {
    return this.ketQuaService.getKetQuaCuaToi(userId);
  }
}