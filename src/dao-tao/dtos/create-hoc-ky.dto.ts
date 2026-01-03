import { IsNotEmpty, IsInt, IsOptional, IsDateString, Length } from 'class-validator';

export class CreateHocKyDto {
  @IsNotEmpty({ message: 'Tên học kỳ là bắt buộc' })
  @Length(1, 10)
  tenHocKy: string;

  @IsNotEmpty()
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  ngayBatDau: string;

  @IsNotEmpty()
  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  ngayKetThuc: string;

  @IsNotEmpty({ message: 'Năm học là bắt buộc' })
  @IsInt()
  namHocId: number;
}