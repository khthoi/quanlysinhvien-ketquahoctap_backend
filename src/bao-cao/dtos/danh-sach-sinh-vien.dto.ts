import { IsOptional, IsInt, IsString, IsIn, IsNumber, Min, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { TinhTrangHocTapEnum } from 'src/sinh-vien/enums/tinh-trang-hoc-tap.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DanhSachSinhVienReportDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm theo MSSV hoặc họ tên của sinh viên', example: 'Nguyen Van A' })
  // Lọc chung
  @IsOptional()
  @IsString()
  search?: string; // tìm theo MSSV hoặc họ tên

  @ApiPropertyOptional({ description: 'ID lớp hành chính', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  lopId?: number; // lớp hành chính

  @ApiPropertyOptional({ description: 'ID ngành', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nganhId?: number;

  @ApiPropertyOptional({ description: 'ID niên khóa', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nienKhoaId?: number;

  @ApiPropertyOptional({ description: 'ID lớp học phần', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  lopHocPhanId?: number;

  @ApiPropertyOptional({ description: 'ID học kỳ', example: 1 })
  // Theo tình trạng
  @IsOptional()
  @IsIn(Object.values(TinhTrangHocTapEnum))
  tinhTrang?: TinhTrangHocTapEnum;

  @ApiPropertyOptional({ description: 'Điểm GPA tối thiểu', example: 2.5 })
  // Theo kết quả học tập
  @IsOptional()
  @IsNumber()
  gpaMin?: number;

  @ApiPropertyOptional({ description: 'Điểm GPA tối đa', example: 3.5 })
  @IsOptional()
  @IsNumber()
  gpaMax?: number;

  @ApiPropertyOptional({ description: 'Số tín chỉ đã hoàn thành tối thiểu', example: 30 })
  // Cảnh báo
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  gpaDuoi2?: boolean;

  @ApiPropertyOptional({ description: 'Số môn rớt tối thiểu', example: 2 })
  @IsOptional()
  @IsInt()
  @Min(2)
  soMonRotMin?: number;

  @ApiPropertyOptional({ description: 'Số môn rớt tối đa', example: 5 })
  // Khen thưởng / kỷ luật
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  coKhenThuong?: boolean;


  @ApiPropertyOptional({ description: 'Số môn kỷ luật tối thiểu', example: 1 })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  coKyLuat?: boolean;
}