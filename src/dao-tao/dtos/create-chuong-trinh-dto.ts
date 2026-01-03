import { IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateChuongTrinhDto {
  @IsNotEmpty()
  tenChuongTrinh: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  thoiGianDaoTao: number; // số năm

  @IsNotEmpty()
  @IsInt()
  nganhId: number;
}