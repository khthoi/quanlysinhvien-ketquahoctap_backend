import { IsNotEmpty, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { LoaiMonEnum } from '../enums/loai-mon.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMonHocDto {
  @ApiProperty({ description: 'Tên môn học', example: 'Toán Cao Cấp' })
  @IsNotEmpty({ message: 'Tên môn học không được để trống' })
  @IsString()
  tenMonHoc: string;

  @ApiProperty({ description: 'Mã môn học', example: 'MATH101' })
  @IsNotEmpty({ message: 'Mã môn học không được để trống' })
  @IsString()
  maMonHoc: string;

  @ApiProperty({ description: 'Loại môn học', example: LoaiMonEnum.CHUYEN_NGANH, enum: LoaiMonEnum })
  @IsNotEmpty({ message: 'Loại môn phải được chọn' })
  @IsEnum(LoaiMonEnum, { message: 'Loại môn không hợp lệ' })
  loaiMon: LoaiMonEnum;

  @ApiProperty({ description: 'Số tín chỉ', example: 3 })
  @IsNotEmpty({ message: 'Số tín chỉ không được để trống' })
  @IsInt()
  @Min(1, { message: 'Số tín chỉ phải lớn hơn hoặc bằng 1' })
  soTinChi: number;

  @ApiPropertyOptional({ description: 'Mô tả về môn học', example: 'Môn học về các khái niệm cơ bản của toán cao cấp' })
  @IsOptional()
  @IsString()
  moTa?: string;
}