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
} from '@nestjs/common';
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
} from '@nestjs/swagger';
import { DaoTaoService } from './dao-tao.service';
import { CreateNamHocDto } from './dtos/create-nam-hoc.dto';
import { UpdateNamHocDto } from './dtos/update-nam-hoc.dto';
import { CreateHocKyDto } from './dtos/create-hoc-ky.dto';
import { UpdateHocKyDto } from './dtos/update-hoc-ky.dto';
import { GetNamHocQueryDto } from './dtos/get-nam-hoc-query.dto';
import { GetHocKyQueryDto } from './dtos/get-hoc-ky-query.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { VaiTroNguoiDungEnum } from 'src/auth/enums/vai-tro-nguoi-dung.enum';
import { CreateApDungDto } from './dtos/create-ap-dung-dto';
import { CreateChuongTrinhDto } from './dtos/create-chuong-trinh-dto';
import { GetApDungQueryDto } from './dtos/get-ap-dung-query.dto';
import { GetChuongTrinhQueryDto } from './dtos/get-chuong-trinh-query.dto';
import { UpdateApDungDto } from './dtos/update-ap-dung-dto';
import { UpdateChuongTrinhDto } from './dtos/update-chuong-trinh-dto';
import { CreateChiTietMonHocDto } from './dtos/create-chi-tiet-mon-hoc.dto';
import { UpdateChiTietMonHocDto } from './dtos/update-chi-tiet-mon-hoc.dto';

@ApiTags('Đào tạo')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Chưa đăng nhập hoặc token hết hạn' })
@ApiForbiddenResponse({ description: 'Không có quyền truy cập (chỉ dành cho cán bộ phòng Đào tạo)' })
@Controller('dao-tao')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
export class DaoTaoController {
  constructor(private readonly daoTaoService: DaoTaoService) {}

  /* ==================== NĂM HỌC ==================== */

  @ApiOperation({ summary: 'Lấy danh sách năm học (có thể lọc và phân trang)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang hiện tại' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số bản ghi mỗi trang' })
  @ApiQuery({ name: 'namBatDau', required: false, type: Number, description: 'Lọc theo năm bắt đầu' })
  @ApiResponse({ status: 200, description: 'Danh sách năm học' })
  @Get('nam-hoc')
  async getAllNamHoc(@Query() query: GetNamHocQueryDto) {
    return this.daoTaoService.getAllNamHoc(query);
  }

  @ApiOperation({ summary: 'Tạo năm học mới' })
  @ApiBody({ type: CreateNamHocDto })
  @ApiResponse({ status: 201, description: 'Năm học đã được tạo thành công' })
  @Post('nam-hoc')
  async createNamHoc(@Body() dto: CreateNamHocDto) {
    return this.daoTaoService.createNamHoc(dto);
  }

  @ApiOperation({ summary: 'Cập nhật thông tin năm học' })
  @ApiParam({ name: 'id', type: Number, description: 'ID năm học' })
  @ApiBody({ type: UpdateNamHocDto })
  @ApiResponse({ status: 200, description: 'Năm học đã được cập nhật' })
  @Put('nam-hoc/:id')
  async updateNamHoc(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNamHocDto,
  ) {
    return this.daoTaoService.updateNamHoc(id, dto);
  }

  @ApiOperation({ summary: 'Xóa năm học' })
  @ApiParam({ name: 'id', type: Number, description: 'ID năm học' })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @Delete('nam-hoc/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNamHoc(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.daoTaoService.deleteNamHoc(id);
  }

  /* ==================== HỌC KỲ ==================== */

  @ApiOperation({ summary: 'Lấy danh sách học kỳ (có thể lọc theo năm học, phân trang)' })
  @ApiQuery({ name: 'namHocId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách học kỳ' })
  @Get('hoc-ky')
  async getAllHocKy(@Query() query: GetHocKyQueryDto) {
    return this.daoTaoService.getAllHocKy(query);
  }

  @ApiOperation({ summary: 'Tạo học kỳ mới' })
  @ApiBody({ type: CreateHocKyDto })
  @ApiResponse({ status: 201, description: 'Học kỳ đã được tạo' })
  @Post('hoc-ky')
  async createHocKy(@Body() dto: CreateHocKyDto) {
    return this.daoTaoService.createHocKy(dto);
  }

  @ApiOperation({ summary: 'Cập nhật học kỳ' })
  @ApiParam({ name: 'id', type: Number, description: 'ID học kỳ' })
  @ApiBody({ type: UpdateHocKyDto })
  @ApiResponse({ status: 200, description: 'Học kỳ đã được cập nhật' })
  @Put('hoc-ky/:id')
  async updateHocKy(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHocKyDto,
  ) {
    return this.daoTaoService.updateHocKy(id, dto);
  }

  @ApiOperation({ summary: 'Xóa học kỳ' })
  @ApiParam({ name: 'id', type: Number, description: 'ID học kỳ' })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @Delete('hoc-ky/:id')
  async deleteHocKy(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.daoTaoService.deleteHocKy(id);
  }

  /* ==================== CHƯƠNG TRÌNH ĐÀO TẠO ==================== */

  @ApiOperation({ summary: 'Tạo chương trình đào tạo mới' })
  @ApiBody({ type: CreateChuongTrinhDto })
  @ApiResponse({ status: 201, description: 'Chương trình đào tạo đã được tạo' })
  @Post('chuong-trinh')
  async createChuongTrinh(@Body() dto: CreateChuongTrinhDto) {
    return this.daoTaoService.createChuongTrinh(dto);
  }

  @ApiOperation({ summary: 'Lấy danh sách chương trình đào tạo (có lọc và phân trang)' })
  @ApiQuery({ name: 'nganhId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách chương trình đào tạo' })
  @Get('chuong-trinh')
  async getAllChuongTrinh(@Query() query: GetChuongTrinhQueryDto) {
    return this.daoTaoService.getAllChuongTrinh(query);
  }

  @ApiOperation({ summary: 'Lấy thông tin chi tiết một chương trình đào tạo' })
  @ApiParam({ name: 'id', type: Number, description: 'ID chương trình đào tạo' })
  @ApiResponse({ status: 200, description: 'Thông tin chương trình đào tạo' })
  @Get('chuong-trinh/:id')
  async getChuongTrinhById(@Param('id', ParseIntPipe) id: number) {
    return this.daoTaoService.getChuongTrinhById(id);
  }

  @ApiOperation({ summary: 'Cập nhật chương trình đào tạo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateChuongTrinhDto })
  @ApiResponse({ status: 200, description: 'Chương trình đã được cập nhật' })
  @Put('chuong-trinh/:id')
  async updateChuongTrinh(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChuongTrinhDto,
  ) {
    return this.daoTaoService.updateChuongTrinh(id, dto);
  }

  @ApiOperation({ summary: 'Xóa chương trình đào tạo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @Delete('chuong-trinh/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChuongTrinh(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.daoTaoService.deleteChuongTrinh(id);
  }

  /* ==================== ÁP DỤNG CHƯƠNG TRÌNH ==================== */

  @ApiOperation({ summary: 'Áp dụng chương trình đào tạo cho một đối tượng (lớp, niên khóa...)' })
  @ApiBody({ type: CreateApDungDto })
  @ApiResponse({ status: 201, description: 'Áp dụng thành công' })
  @Post('ap-dung')
  async createApDung(@Body() dto: CreateApDungDto) {
    return this.daoTaoService.createApDung(dto);
  }

  @ApiOperation({ summary: 'Lấy danh sách các áp dụng chương trình đào tạo' })
  @ApiQuery({ name: 'chuongTrinhId', required: false, type: Number })
  @ApiQuery({ name: 'lopId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách áp dụng' })
  @Get('ap-dung')
  async getAllApDung(@Query() query: GetApDungQueryDto) {
    return this.daoTaoService.getAllApDung(query);
  }

  @ApiOperation({ summary: 'Lấy chi tiết một bản ghi áp dụng' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Thông tin áp dụng' })
  @Get('ap-dung/:id')
  async getApDungById(@Param('id', ParseIntPipe) id: number) {
    return this.daoTaoService.getApDungById(id);
  }

  @ApiOperation({ summary: 'Cập nhật thông tin áp dụng chương trình' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateApDungDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @Put('ap-dung/:id')
  async updateApDung(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApDungDto,
  ) {
    return this.daoTaoService.updateApDung(id, dto);
  }

  @ApiOperation({ summary: 'Xóa áp dụng chương trình' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @Delete('ap-dung/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteApDung(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.daoTaoService.deleteApDung(id);
  }

  /* ==================== CHI TIẾT CHƯƠNG TRÌNH ĐÀO TẠO (MÔN HỌC TRONG CTĐT) ==================== */

  @ApiOperation({ summary: 'Thêm môn học vào chương trình đào tạo' })
  @ApiParam({ name: 'chuong_trinh_id', type: Number, description: 'ID chương trình đào tạo' })
  @ApiBody({ type: CreateChiTietMonHocDto })
  @ApiResponse({ status: 201, description: 'Môn học đã được thêm vào chương trình' })
  @Post('chuong-trinh/mon-hoc/:chuong_trinh_id')
  async themMonHocVaoChuongTrinh(
    @Param('chuong_trinh_id', ParseIntPipe) chuongTrinhId: number,
    @Body() dto: CreateChiTietMonHocDto,
  ) {
    return this.daoTaoService.themMonHocVaoChuongTrinh(chuongTrinhId, dto);
  }

  @ApiOperation({ summary: 'Cập nhật chi tiết môn học trong chương trình đào tạo' })
  @ApiParam({ name: 'chi_tiet_chuong_trinh_dt_id', type: Number, description: 'ID chi tiết chương trình' })
  @ApiBody({ type: UpdateChiTietMonHocDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @Put('chuong-trinh/chi-tiet/:chi_tiet_chuong_trinh_dt_id')
  async suaChiTietMonHoc(
    @Param('chi_tiet_chuong_trinh_dt_id', ParseIntPipe) id: number,
    @Body() dto: UpdateChiTietMonHocDto,
  ) {
    return this.daoTaoService.suaChiTietMonHoc(id, dto);
  }

  @ApiOperation({ summary: 'Xóa môn học khỏi chương trình đào tạo' })
  @ApiParam({ name: 'chi_tiet_chuong_trinh_dt_id', type: Number })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @Delete('chuong-trinh/chi-tiet/:chi_tiet_chuong_trinh_dt_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async xoaMonKhoiChuongTrinh(
    @Param('chi_tiet_chuong_trinh_dt_id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.daoTaoService.xoaMonKhoiChuongTrinh(id);
  }

  @ApiOperation({ summary: 'Lấy thông tin chi tiết một môn học trong chương trình' })
  @ApiParam({ name: 'chi_tiet_chuong_trinh_dt_id', type: Number })
  @ApiResponse({ status: 200, description: 'Thông tin chi tiết môn học' })
  @Get('chuong-trinh/chi-tiet/:chi_tiet_chuong_trinh_dt_id')
  async getChiTietMonHoc(@Param('chi_tiet_chuong_trinh_dt_id', ParseIntPipe) id: number) {
    return this.daoTaoService.getChiTietMonHoc(id);
  }

  @ApiOperation({ summary: 'Lấy tất cả môn học thuộc một chương trình đào tạo' })
  @ApiParam({ name: 'chuong_trinh_id', type: Number, description: 'ID chương trình đào tạo' })
  @ApiResponse({ status: 200, description: 'Danh sách môn học trong chương trình' })
  @Get('chuong-trinh/tat-ca-mon-hoc/:chuong_trinh_id')
  async getTatCaMonHocTrongChuongTrinh(
    @Param('chuong_trinh_id', ParseIntPipe) chuongTrinhId: number,
  ) {
    return this.daoTaoService.getTatCaMonHocTrongChuongTrinh(chuongTrinhId);
  }
}