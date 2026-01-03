// src/dao-tao/dao-tao.controller.ts
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

@Controller('dao-tao')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO)
export class DaoTaoController {
  constructor(private readonly daoTaoService: DaoTaoService) {}

  // ==================== NĂM HỌC ====================

  @Get('nam-hoc')
  async getAllNamHoc(@Query() query: GetNamHocQueryDto) {
    return this.daoTaoService.getAllNamHoc(query);
  }

  @Post('nam-hoc')
  async createNamHoc(@Body() dto: CreateNamHocDto) {
    return this.daoTaoService.createNamHoc(dto);
  }

  @Put('nam-hoc/:id')
  async updateNamHoc(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNamHocDto,
  ) {
    return this.daoTaoService.updateNamHoc(id, dto);
  }

  @Delete('nam-hoc/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNamHoc(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.daoTaoService.deleteNamHoc(id);
  }

  // ==================== HỌC KỲ ====================

  @Get('hoc-ky')
  async getAllHocKy(@Query() query: GetHocKyQueryDto) {
    return this.daoTaoService.getAllHocKy(query);
  }

  @Post('hoc-ky')
  async createHocKy(@Body() dto: CreateHocKyDto) {
    return this.daoTaoService.createHocKy(dto);
  }

  @Put('hoc-ky/:id')
  async updateHocKy(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHocKyDto,
  ) {
    return this.daoTaoService.updateHocKy(id, dto);
  }

  @Delete('hoc-ky/:id')
  async deleteHocKy(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.daoTaoService.deleteHocKy(id);
  }
}