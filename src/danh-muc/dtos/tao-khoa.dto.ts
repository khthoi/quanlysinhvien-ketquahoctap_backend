import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDate, IsDateString } from 'class-validator';

export class CreateKhoaDto {

  @ApiProperty({ description: 'Mã khoa', example: 'K001' })
  @IsString()
  maKhoa: string;

  @ApiProperty({ description: 'Tên khoa', example: 'Khoa Kỹ thuật' })
  @IsString()
  tenKhoa: string;

  @ApiPropertyOptional({ description: 'Mô tả về khoa', example: 'Khoa chuyên về các ngành kỹ thuật' })
  @IsOptional()
  @IsString()
  moTa?: string;

  @ApiPropertyOptional({ description: 'Ngày thành lập khoa', example: '2022-01-15' }) 
  @IsOptional()
  @IsDateString()
  ngayThanhLap?: string;
}