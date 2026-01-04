import { IsOptional, IsInt, IsString, IsIn, IsNumber, Min, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { TinhTrangHocTapEnum } from 'src/sinh-vien/enums/tinh-trang-hoc-tap.enum';

export class DanhSachSinhVienReportDto {
  // Lọc chung
  @IsOptional()
  @IsString()
  search?: string; // tìm theo MSSV hoặc họ tên

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  lopId?: number; // lớp hành chính

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nganhId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nienKhoaId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  lopHocPhanId?: number;

  // Theo tình trạng
  @IsOptional()
  @IsIn(Object.values(TinhTrangHocTapEnum))
  tinhTrang?: TinhTrangHocTapEnum;

  // Theo kết quả học tập
  @IsOptional()
  @IsNumber()
  gpaMin?: number;

  @IsOptional()
  @IsNumber()
  gpaMax?: number;

  // Cảnh báo
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  gpaDuoi2?: boolean;

  @IsOptional()
  @IsInt()
  @Min(2)
  soMonRotMin?: number;

  // Khen thưởng / kỷ luật
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  coKhenThuong?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  coKyLuat?: boolean;
}