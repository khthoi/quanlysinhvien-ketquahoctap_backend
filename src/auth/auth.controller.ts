import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Delete,
  Patch,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginDto } from './dtos/login.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { GetUser } from './decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('new-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async getAllUsers() {
    return this.authService.findAll();
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return this.authService.findOne(id);
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.update(id, updateUserDto);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.authService.remove(id);
  }

  @Patch('change-password/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('sub') userId: number,
    @GetUser('role') role: string,
    @Body() dto: ChangePasswordDto,
  ) {
    // Nếu không phải chính mình và cũng không phải Admin → cấm
    if (userId !== id && role !== 'Admin') {
      throw new ForbiddenException('Bạn không có quyền đổi mật khẩu người khác');
    }

    return this.authService.changePassword(id, dto);
  }

}