import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsNotEmpty, IsNumber, IsString, ValidateNested, Max, Min } from 'class-validator';

export class ImportLopHocPhanResultDto {
    @ApiProperty()
    message: string;

    @ApiProperty()
    summary: {
        success: number;
        failed: number;
        total: number;
    };

    @ApiProperty()
    details: {
        row: number;
        maLopHocPhan:  string;
        status: 'success' | 'failed';
        message:  string;
        soSinhVienDaDangKy?:  number;
    }[];

    @ApiProperty()
    errors?:  {
        row:  number;
        maLopHocPhan: string;
        error: string;
    }[];
}

export class ImportLopHocPhanItemDto {
  @ApiProperty({
    example: 'LHP001',
    description: 'Mã lớp học phần',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mã lớp học phần không được để trống' })
  maLopHocPhan: string;

  @ApiPropertyOptional({
    example: 'Lớp học phần buổi tối',
    description: 'Ghi chú thêm cho lớp học phần',
  })
  @IsString()
  @IsOptional()
  ghiChu?: string;

  @ApiProperty({
    example: 'CNTT',
    description: 'Mã ngành đào tạo',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mã ngành không được để trống' })
  maNganh: string;

  @ApiProperty({
    example: 'NK2024',
    description: 'Mã niên khóa',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mã niên khóa không được để trống' })
  maNienKhoa: string;

  @ApiProperty({
    example: 'MH001',
    description: 'Mã môn học',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mã môn học không được để trống' })
  maMonHoc: string;

  @ApiProperty({
    example: 'NH2024',
    description: 'Mã năm học',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mã năm học không được để trống' })
  maNamHoc: string;

  @ApiProperty({
    example: 1,
    description: 'Học kỳ (bắt đầu từ 1)',
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty({ message: 'Học kỳ không được để trống' })
  @Min(1, { message: 'Học kỳ phải lớn hơn 0' })
  hocKy: number;

  @ApiPropertyOptional({
    example: 'GV001',
    description: 'Mã giảng viên phụ trách',
  })
  @IsString()
  @IsOptional()
  maGiangVien?: string;

  @ApiPropertyOptional({
    example: 35,
    description: 'Số sinh viên dự kiến tham gia',
    minimum: 0,
    maximum: 40,
  })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Số sinh viên tham gia phải lớn hơn hoặc bằng 0' })
  @Max(40, { message: 'Số sinh viên tham gia không được vượt quá 40' })
  soSinhVienSeThamGia?: number;
}

export class ImportLopHocPhanJsonDto {
  @ApiProperty({
    type: [ImportLopHocPhanItemDto],
    description: 'Danh sách lớp học phần import',
    example: [
      {
        maLopHocPhan: 'LHP001',
        ghiChu: 'Lớp sáng',
        maNganh: 'CNTT',
        maNienKhoa: 'NK2024',
        maMonHoc: 'MH001',
        maNamHoc: 'NH2024',
        hocKy: 1,
        maGiangVien: 'GV001',
        soSinhVienSeThamGia: 35,
      },
      {
        maLopHocPhan: 'LHP002',
        ghiChu: 'Lớp chiều',
        maNganh: 'QTKD',
        maNienKhoa: 'NK2024',
        maMonHoc: 'MH010',
        maNamHoc: 'NH2024',
        hocKy: 2,
        maGiangVien: 'GV010',
        soSinhVienSeThamGia: 30,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportLopHocPhanItemDto)
  @ArrayMinSize(1, { message: 'Danh sách lớp học phần không được để trống' })
  lopHocPhans: ImportLopHocPhanItemDto[];
}
