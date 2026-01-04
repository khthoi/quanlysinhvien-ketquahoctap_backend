import { Controller, Get, Post, Param, Body, Res, ParseIntPipe, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { BaoCaoService } from './bao-cao.service';
import { 
  FilterHocLaiDto, 
  FilterThongKeNganhDto, 
  FilterThongKeLopHocPhanDto, 
  FilterDanhSachSinhVienDto 
} from './dtos/query-bao-cao.dto';

@Controller('bao-cao')
export class BaoCaoController {
  constructor(private readonly baoCaoService: BaoCaoService) {}

  /**
   * GET /bao-cao/bang-diem-lop-hoc-phan/:id
   * Xuất bảng điểm của tất cả sinh viên trong 1 lớp học phần
   */
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

  /**
   * GET /bao-cao/phieu-diem/:sinh-vien_id
   * Xuất phiếu điểm cá nhân của sinh viên
   */
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

  /**
   * GET /bao-cao/giang-vien/:giang-vien_id
   * Báo cáo giảng dạy của giảng viên
   */
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

  /**
   * POST /bao-cao/sinh-vien/hoc-lai
   * Danh sách sinh viên học lại/cải thiện
   * Body: { hocKyId?, nganhId?, nienKhoaId?, loaiHocLai?: 'HOC_LAI' | 'HOC_CAI_THIEN' | 'TAT_CA' }
   */
  @Post('sinh-vien/hoc-lai')
  async xuatDanhSachHocLai(
    @Body() filterDto: FilterHocLaiDto,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.baoCaoService.xuatDanhSachHocLai(filterDto);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=danh-sach-hoc-lai.xlsx');
      res.status(HttpStatus.OK).send(buffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Lỗi khi xuất danh sách học lại',
      });
    }
  }

  /**
   * POST /bao-cao/thong-ke/nganh-hoc-ky
   * Thống kê kết quả theo ngành/học kỳ
   * Body: { nganhId: number, hocKyId: number, nienKhoaId?: number }
   */
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

  /**
   * POST /bao-cao/thong-ke/lop-hoc-phan
   * Thống kê kết quả lớp học phần
   * Body: { lopHocPhanIds?: number[], hocKyId?: number, monHocId?: number, giangVienId?: number }
   */
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

  /**
   * POST /bao-cao/danh-sach-sinh-vien
   * Danh sách sinh viên tổng hợp
   * Body: { 
   *   loaiDanhSach: 'LOP_HANH_CHINH' | 'NGANH_NIEN_KHOA' | 'LOP_HOC_PHAN' | 'ROT_2_MON_TRO_LEN' | 'CANH_BAO_GPA' | 'KHEN_THUONG',
   *   lopId?, nganhId?, nienKhoaId?, lopHocPhanId?, hocKyId?, nguongGPA?, xepLoai?
   * }
   */
  @Post('danh-sach-sinh-vien')
  async xuatDanhSachSinhVien(
    @Body() filterDto: FilterDanhSachSinhVienDto,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.baoCaoService.xuatDanhSachSinhVien(filterDto);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=danh-sach-sinh-vien.xlsx');
      res.status(HttpStatus.OK).send(buffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Lỗi khi xuất danh sách sinh viên',
      });
    }
  }
}