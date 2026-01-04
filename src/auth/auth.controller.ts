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
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginDto } from './dtos/login.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { RequestChangePasswordDto } from './dtos/request-change-password.dto';
import { VerifyChangePasswordOtpDto } from './dtos/verify-change-password-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { GetUsersQueryDto } from './dtos/get-user-query.dto';
import { VaiTroNguoiDungEnum } from './enums/vai-tro-nguoi-dung.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('new-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.ADMIN)
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.ADMIN)
  async getAllUsers(@Query() query: GetUsersQueryDto) {
    return this.authService.findAll(query);
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.ADMIN)
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return this.authService.findOne(id);
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.ADMIN)
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
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.authService.remove(id);
  }

  /**
   * Bước 1: Yêu cầu đổi mật khẩu - Gửi OTP qua email
   */
  @Post('change-password/me')
  @UseGuards(JwtAuthGuard)
  async requestChangePassword(
    @GetUser('userId') userId: number,
    @Body() dto: RequestChangePasswordDto,
  ) {
    return this.authService.requestChangePassword(userId, dto);
  }

  /**
   * Bước 2: Xác thực OTP và đổi mật khẩu
   */
  @Post('change-password/verify-otp')
  @UseGuards(JwtAuthGuard)
  async verifyChangePasswordOtp(
    @GetUser('sub') userId: number,
    @Body() dto: VerifyChangePasswordOtpDto,
  ) {
    return this.authService.verifyChangePasswordOtp(userId, dto);
  }

  @Post('reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.ADMIN)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('users/sinh-vien/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.ADMIN, VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async createAccountForSinhVien(
    @Param('id', ParseIntPipe) sinhVienId: number,
  ) {
    return this.authService.createAccountForSinhVienBasic(sinhVienId);
  }

  @Post('users/giang-vien/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTroNguoiDungEnum.ADMIN, VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
  async createAccountForGiangVien(
    @Param('id', ParseIntPipe) giangVienId: number,
  ) {
    return this.authService.createAccountForGiangVienBasic(giangVienId);
  }
}