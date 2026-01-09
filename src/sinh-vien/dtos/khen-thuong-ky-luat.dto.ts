import { IsNotEmpty, IsEnum, IsDateString, IsString, IsOptional } from 'class-validator';
import { LoaiKhenThuongKyLuatEnum } from '../entity/khenthuong-kyluat.entity';
import { ApiProperty } from '@nestjs/swagger';

export class KhenThuongKyLuatDto {

  @ApiProperty({ description: 'Loại khen thưởng/kỷ luật', example: 'KHEN_THUONG' })
  @IsNotEmpty()
  @IsEnum(LoaiKhenThuongKyLuatEnum)
  loai: LoaiKhenThuongKyLuatEnum;

  @ApiProperty({ description: 'Nội dung khen thưởng/kỷ luật', example: 'Đạt thành tích xuất sắc trong học tập' })
  @IsNotEmpty()
  noiDung: string;

  @ApiProperty({ description: 'Ngày quyết định', example: '2023-05-15' })
  @IsNotEmpty()
  @IsDateString({}, { message: 'ngayQuyetDinh phải có định dạng YYYY-MM-DD' })
  ngayQuyetDinh: string;
}

export class GetKhenThuongKyLuatFilterDto {

  @ApiProperty({ description: 'Lọc theo loại khen thưởng/kỷ luật', example: 'KY_LUAT', required: false })
  @IsOptional()
  @IsEnum(LoaiKhenThuongKyLuatEnum)
  loai?: LoaiKhenThuongKyLuatEnum;
}