import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginDto } from './dtos/login.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { RequestChangePasswordDto } from './dtos/request-change-password.dto';
import { VerifyChangePasswordOtpDto } from './dtos/verify-change-password-otp.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { GetUsersQueryDto } from './dtos/get-user-query.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { VaiTroNguoiDungEnum } from './enums/vai-tro-nguoi-dung.enum';
import { GetAllUsersResponseDto, GetUserResponseDto } from './dtos/get-all-users-response.dto';
import { AutoCreateAccountsResponseDto } from './dtos/auto-create-accounts.response.dto';

@ApiTags('Xác thực & Quản lý người dùng')
@ApiBearerAuth() // Áp dụng JWT cho tất cả API cần auth
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập hệ thống' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công, trả về JWT token' })
  @ApiResponse({ status: 401, description: 'Sai tên đăng nhập hoặc mật khẩu' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('new-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.ADMIN)
  @ApiOperation({ summary: 'Tạo người dùng mới (chỉ Admin)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Tạo người dùng thành công' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách người dùng (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách người dùng với phân trang và profile chi tiết',
    type: GetAllUsersResponseDto,
  })
  async getAllUsers(@Query() query: GetUsersQueryDto) {
    return this.authService.findAll(query);
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.ADMIN)
  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID (Admin)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin chi tiết người dùng',
    type: GetUserResponseDto, // <-- Quan trọng: khai báo type response
  })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Chỉ admin mới được truy cập' })
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return this.authService.findOne(id);
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.ADMIN)
  @ApiOperation({ summary: 'Cập nhật người dùng (Admin)' })
  @ApiParam({ name: 'id', description: 'ID người dùng' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.update(id, updateUserDto);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa người dùng (Admin)' })
  @ApiParam({ name: 'id', description: 'ID người dùng' })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.authService.remove(id);
  }

  @Post('change-password/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Yêu cầu đổi mật khẩu (gửi OTP qua email)' })
  @ApiBody({ type: RequestChangePasswordDto })
  @ApiResponse({ status: 200, description: 'OTP đã được gửi' })
  async requestChangePassword(
    @GetUser('userId') userId: number,
    @Body() dto: RequestChangePasswordDto,
  ) {
    return this.authService.requestChangePassword(userId, dto);
  }

  @Post('change-password/verify-otp')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xác thực OTP và đổi mật khẩu' })
  @ApiBody({ type: VerifyChangePasswordOtpDto })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  async verifyChangePasswordOtp(
    @GetUser('userId') userId: number,
    @Body() dto: VerifyChangePasswordOtpDto,
  ) {
    return this.authService.verifyChangePasswordOtp(userId, dto);
  }

  @Post('reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.ADMIN)
  @ApiOperation({ summary: 'Reset mật khẩu người dùng khác (Admin)' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('users/sinh-vien/auto-create-accounts')
  @ApiOperation({
    summary: 'Tự động tạo tài khoản cho tất cả sinh viên chưa có tài khoản',
    description:
      'API sẽ quét toàn bộ sinh viên, tạo tài khoản với tên đăng nhập = mã sinh viên, ' +
      'mật khẩu mặc định, vai trò SINH_VIEN. Chỉ tạo cho sinh viên chưa có tài khoản và có email hợp lệ.',
  })
  @ApiResponse({
    status: 200,
    description: 'Kết quả tạo tài khoản hàng loạt',
    type: AutoCreateAccountsResponseDto, // ← Thêm dòng này
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO, VaiTroNguoiDungEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async autoCreateAccountsForAllSinhVien() {
    return this.authService.autoCreateAccountsForAllSinhVien();
  }
  @Post('users/giang-vien/auto-create-accounts')
  @ApiOperation({
    summary: 'Tự động tạo tài khoản cho tất cả giảng viên chưa có tài khoản',
    description:
      'API quét toàn bộ giảng viên, tạo tài khoản với tên đăng nhập = mã giảng viên, ' +
      'mật khẩu mặc định, vai trò GIANG_VIEN. Chỉ tạo cho giảng viên chưa có tài khoản và có email hợp lệ.',
  })
  @ApiResponse({ status: 200, description: 'Kết quả tạo tài khoản hàng loạt cho giảng viên' })
  @ApiBearerAuth()
  @Roles(VaiTroNguoiDungEnum.ADMIN, VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @HttpCode(HttpStatus.OK)
  async autoCreateAccountsForAllGiangVien() {
    return this.authService.autoCreateAccountsForAllGiangVien();
  }

  @Post('users/sinh-vien/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.ADMIN, VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @ApiOperation({ summary: 'Tạo tài khoản cho sinh viên' })
  @ApiParam({ name: 'id', description: 'ID sinh viên' })
  @ApiResponse({ status: 201, description: 'Tài khoản sinh viên được tạo' })
  async createAccountForSinhVien(@Param('id', ParseIntPipe) sinhVienId: number) {
    return this.authService.createAccountForSinhVienBasic(sinhVienId);
  }

  @Post('users/giang-vien/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.ADMIN, VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  @ApiOperation({ summary: 'Tạo tài khoản cho giảng viên' })
  @ApiParam({ name: 'id', description: 'ID giảng viên' })
  @ApiResponse({ status: 201, description: 'Tài khoản giảng viên được tạo' })
  async createAccountForGiangVien(@Param('id', ParseIntPipe) giangVienId: number) {
    return this.authService.createAccountForGiangVienBasic(giangVienId);
  }
}