import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, IsString, IsOptional, IsEnum } from 'class-validator';
import { TrangThaiYeuCauHocPhanEnum } from '../enums/yeu-cau-hoc-phan.enum';

export class DuyetYeuCauHocPhanDto {
  @ApiProperty({ description: 'ID yêu cầu học phần', example: 1 })
  @IsNotEmpty()
  @IsInt()
  yeuCauId: number;

  @ApiProperty({ description: 'ID lớp học phần được duyệt', example: 5 })
  @IsNotEmpty()
  @IsInt()
  lopHocPhanId: number;

  @ApiPropertyOptional({ description: 'Ghi chú của phòng đào tạo', example: 'Đã duyệt yêu cầu' })
  @IsOptional()
  @IsString()
  ghiChuPhongDaoTao?: string;
}

export class TuChoiYeuCauHocPhanDto {
  @ApiProperty({ description: 'ID yêu cầu học phần', example: 1 })
  @IsNotEmpty()
  @IsInt()
  yeuCauId: number;

  @ApiPropertyOptional({ description: 'Ghi chú của phòng đào tạo', example: 'Yêu cầu không hợp lệ' })
  @IsOptional()
  @IsString()
  ghiChuPhongDaoTao?: string;
}

export class XoaYeuCauHocPhanDto {
  @ApiProperty({ description: 'ID yêu cầu học phần', example: 1 })
  @IsNotEmpty()
  @IsInt()
  yeuCauId: number;
}

export class ChuyenTrangThaiDangXuLyDto {
  @ApiProperty({ description: 'ID yêu cầu học phần', example: 1 })
  @IsNotEmpty()
  @IsInt()
  yeuCauId: number;
}
