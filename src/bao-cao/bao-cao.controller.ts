import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  ParseIntPipe,
  HttpStatus,
  Query,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiProduces,
} from '@nestjs/swagger';
import { BaoCaoService } from './bao-cao.service';
import {
  FilterHocLaiDto,
  FilterThongKeNganhDto,
  FilterThongKeLopHocPhanDto,
} from './dtos/query-bao-cao.dto';
import { DanhSachSinhVienReportDto } from './dtos/danh-sach-sinh-vien.dto';

@ApiTags('Báo cáo')
@ApiBearerAuth()
@Controller('bao-cao')
export class BaoCaoController {
  constructor(private readonly baoCaoService: BaoCaoService) {}

  @ApiOperation({
    summary: 'Xuất bảng điểm toàn bộ sinh viên trong một lớp học phần (Excel)',
    description: 'Trả về file Excel chứa bảng điểm chi tiết của lớp học phần.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID lớp học phần' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'File Excel bảng điểm lớp học phần' })
  @ApiResponse({ status: 404, description: 'Lớp học phần không tồn tại' })
  @ApiResponse({ status: 500, description: 'Lỗi khi xuất báo cáo' })
  @Get('bang-diem-lop-hoc-phan/:id')
  async xuatBangDiemLopHocPhan(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      const { buffer, filename } = await this.baoCaoService.xuatBangDiemLopHocPhan(id);
      const encodedFilename = encodeURIComponent(filename);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
      res.status(HttpStatus.OK).send(buffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Lỗi khi xuất báo cáo',
      });
    }
  }

  @ApiOperation({
    summary: 'Xuất phiếu điểm cá nhân của một sinh viên (Excel)',
    description: 'Trả về file Excel chứa toàn bộ kết quả học tập của sinh viên.',
  })
  @ApiParam({ name: 'sinh_vien_id', type: Number, description: 'ID sinh viên' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'File Excel phiếu điểm cá nhân' })
  @ApiResponse({ status: 404, description: 'Sinh viên không tồn tại' })
  @ApiResponse({ status: 500, description: 'Lỗi khi xuất phiếu điểm' })
  @Get('phieu-diem/:sinh_vien_id')
  async xuatPhieuDiem(
    @Param('sinh_vien_id', ParseIntPipe) sinhVienId: number,
    @Res() res: Response,
  ) {
    try {
      const { buffer, filename } = await this.baoCaoService.xuatPhieuDiemCaNhan(sinhVienId);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const encodedFilename = encodeURIComponent(filename);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
      res.status(HttpStatus.OK).send(buffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Lỗi khi xuất phiếu điểm',
      });
    }
  }

  @ApiOperation({
    summary: 'Xuất báo cáo giảng dạy của một giảng viên (Excel)',
    description: 'Trả về file Excel thống kê các lớp học phần giảng viên đã dạy.',
  })
  @ApiParam({ name: 'giang_vien_id', type: Number, description: 'ID giảng viên' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'File Excel báo cáo giảng dạy' })
  @ApiResponse({ status: 404, description: 'Giảng viên không tồn tại' })
  @ApiResponse({ status: 500, description: 'Lỗi khi xuất báo cáo giảng viên' })
  @Get('giang-vien/:giang_vien_id')
  async xuatBaoCaoGiangVien(
    @Param('giang_vien_id', ParseIntPipe) giangVienId: number,
    @Res() res: Response,
  ) {
    try {
      const { buffer, filename } = await this.baoCaoService.xuatBaoCaoGiangVien(giangVienId);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const encodedFilename = encodeURIComponent(filename);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
      res.status(HttpStatus.OK).send(buffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Lỗi khi xuất báo cáo giảng viên',
      });
    }
  }

  @ApiOperation({
    summary: 'Xuất danh sách sinh viên học lại / học cải thiện (Excel)',
  })
  @ApiQuery({ name: 'hocKyId', required: false, type: Number, description: 'Lọc theo học kỳ' })
  @ApiQuery({ name: 'nganhId', required: false, type: Number, description: 'Lọc theo ngành' })
  @ApiQuery({ name: 'nienKhoaId', required: false, type: Number, description: 'Lọc theo niên khóa' })
  @ApiQuery({
    name: 'loaiHocLai',
    required: false,
    enum: ['HOC_LAI', 'HOC_CAI_THIEN', 'TAT_CA'],
    description: 'Loại học lại',
  })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'File Excel danh sách học lại' })
  @ApiResponse({ status: 500, description: 'Lỗi khi xuất danh sách học lại' })
  @Get('sinh-vien/hoc-lai')
  async xuatDanhSachHocLai(
    @Query() filterDto: FilterHocLaiDto,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.baoCaoService.xuatDanhSachHocLai(filterDto);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=danh-sach-hoc-lai.xlsx',
      );

      res.status(HttpStatus.OK).send(buffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Lỗi khi xuất danh sách học lại',
      });
    }
  }

  @ApiOperation({
    summary: 'Xuất thống kê kết quả học tập theo ngành và học kỳ (Excel)',
  })
  @ApiBody({ type: FilterThongKeNganhDto })
  @ApiConsumes('application/json')
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'File Excel thống kê ngành - học kỳ' })
  @ApiResponse({ status: 400, description: 'Thiếu tham số bắt buộc' })
  @ApiResponse({ status: 500, description: 'Lỗi khi xuất thống kê ngành' })
  @Post('thong-ke/nganh-hoc-ky')
  async xuatThongKeNganh(
    @Body() filterDto: FilterThongKeNganhDto,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.baoCaoService.xuatThongKeNganh(filterDto);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=thong-ke-nganh-hoc-ky.xlsx');
      res.status(HttpStatus.OK).send(buffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Lỗi khi xuất thống kê ngành',
      });
    }
  }

  @ApiOperation({
    summary: 'Xuất thống kê kết quả theo lớp học phần (Excel)',
    description: 'Có thể lọc theo nhiều lớp học phần, học kỳ, môn học, giảng viên.',
  })
  @ApiBody({ type: FilterThongKeLopHocPhanDto })
  @ApiConsumes('application/json')
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'File Excel thống kê lớp học phần' })
  @ApiResponse({ status: 500, description: 'Lỗi khi xuất thống kê lớp học phần' })
  @Post('thong-ke/lop-hoc-phan')
  async xuatThongKeLopHocPhan(
    @Body() filterDto: FilterThongKeLopHocPhanDto,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.baoCaoService.xuatThongKeLopHocPhan(filterDto);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=thong-ke-lop-hoc-phan.xlsx');
      res.status(HttpStatus.OK).send(buffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Lỗi khi xuất thống kê lớp học phần',
      });
    }
  }

  @ApiOperation({
    summary: 'Xuất các loại danh sách sinh viên tổng hợp (Excel)',
    description:
      'Hỗ trợ nhiều loại báo cáo: lớp hành chính, ngành niên khóa, lớp học phần, tình trạng, kết quả, rớt môn, cảnh báo GPA, khen thưởng kỷ luật.',
  })
  @ApiParam({
    name: 'query',
    type: String,
    enum: [
      'lop-hanh-chinh',
      'nganh-nien-khoa',
      'lop-hoc-phan',
      'tinh-trang',
      'ket-qua',
      'rot-mon',
      'canh-bao-gpa',
      'khen-thuong-ky-luat',
    ],
    description: 'Loại danh sách cần xuất',
  })
  @ApiBody({ type: DanhSachSinhVienReportDto })
  @ApiConsumes('application/json')
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'File Excel danh sách sinh viên' })
  @ApiResponse({ status: 400, description: 'Loại báo cáo không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  @Post('danh-sach-sinh-vien/:query')
  async xuatDanhSachSinhVien(
    @Param('query') queryType: string,
    @Body() filter: DanhSachSinhVienReportDto,
    @Res() res: Response,
  ) {
    const validQueries = [
      'lop-hanh-chinh',
      'nganh-nien-khoa',
      'lop-hoc-phan',
      'tinh-trang',
      'ket-qua',
      'rot-mon',
      'canh-bao-gpa',
      'khen-thuong-ky-luat',
    ];

    if (!validQueries.includes(queryType)) {
      throw new BadRequestException('Loại báo cáo không hợp lệ');
    }

    await this.baoCaoService.xuatDanhSachSinhVien(queryType, filter, res);
  }
}