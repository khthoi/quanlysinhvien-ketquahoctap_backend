import { PartialType } from '@nestjs/mapped-types';
import { CreateSinhVienDto } from './create-sinh-vien.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GioiTinh } from 'src/danh-muc/enums/gioi-tinh.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSinhVienDto extends PartialType(CreateSinhVienDto) {}

export class UpdateSinhVienSelfDto {

    @ApiPropertyOptional({ description: 'Họ tên sinh viên', example: 'Nguyễn Văn A' })
    @IsOptional()
    @IsString()
    hoTen?: string;

    @ApiPropertyOptional({ description: 'Ngày sinh của sinh viên', example: '2000-01-15' })
    @IsOptional()
    @IsString()
    ngaySinh?: string;

    @ApiPropertyOptional({ description: 'Giới tính của sinh viên', example: 'NAM' })
    @IsOptional()
    @IsEnum(GioiTinh, { message: 'gioiTinh phải là một trong các giá trị: NAM, NU, KHONG_XAC_DINH' })
    gioiTinh?: GioiTinh;

    @ApiPropertyOptional({ description: 'Địa chỉ của sinh viên', example: '123 Đường ABC, Quận 1, TP.HCM' })
    @IsOptional()
    @IsString()
    diaChi?: string;

    @ApiPropertyOptional({ description: 'Email của sinh viên', example: 'nguyenvana@example.com' })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({ description: 'Số điện thoại của sinh viên', example: '0123456789' })
    @IsOptional()
    @IsString()
    sdt?: string;

}