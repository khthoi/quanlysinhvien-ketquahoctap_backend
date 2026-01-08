import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDate, IsDateString } from 'class-validator';

export class UpdateKhoaDto {

    @ApiProperty({ description: 'Mã khoa', example: 'K001' })
    @IsString()
    maKhoa: string;

    @ApiPropertyOptional({ description: 'Tên khoa', example: 'Khoa Kỹ thuật' })
    @IsOptional()
    @IsString()
    tenKhoa?: string;

    @ApiPropertyOptional({ description: 'Mô tả về khoa', example: 'Khoa chuyên về các ngành kỹ thuật' })
    @IsOptional()
    @IsString()
    moTa?: string;

    @ApiPropertyOptional({ description: 'Ngày thành lập khoa', example: '2020-01-15T00:00:00Z' })
    @IsOptional()
    @IsDateString()
    ngayThanhLap?: string;
}