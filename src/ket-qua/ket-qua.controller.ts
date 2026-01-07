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
} from '@nestjs/swagger';
import { KetQuaService } from './ket-qua.service';
import { NhapDiemDto } from './dtos/nhap-diem.dto';
import { GetKetQuaLopQueryDto } from './dtos/get-ket-qua-lop-query.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { VaiTroNguoiDungEnum } from 'src/auth/enums/vai-tro-nguoi-dung.enum';

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

  @ApiOperation({
    summary: 'Sửa điểm của một bản ghi kết quả',
    description: 'Chỉ cán bộ phòng Đào tạo được phép sửa điểm đã nhập',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID của bản ghi kết quả học tập' })
  @ApiBody({ type: NhapDiemDto })
  @ApiResponse({ status: 200, description: 'Điểm đã được cập nhật thành công' })
  @Put(':id')
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async suaDiem(@Param('id', ParseIntPipe) id: number, @Body() dto: NhapDiemDto) {
    return this.ketQuaService.suaDiem(id, dto);
  }

  @ApiOperation({
    summary: 'Lấy danh sách điểm của toàn bộ lớp học phần',
    description: 'Chỉ cán bộ phòng Đào tạo được xem',
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
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async getDanhSachDiemLop(
    @Param('lop_hoc_phan_id', ParseIntPipe) lopHocPhanId: number,
    @Query() query: GetKetQuaLopQueryDto,
  ) {
    return this.ketQuaService.getDanhSachDiemLop(lopHocPhanId, query);
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