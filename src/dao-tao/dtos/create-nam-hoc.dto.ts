import { IsNotEmpty, IsInt, Min, Max, Length } from 'class-validator';

export class CreateNamHocDto {
  @IsNotEmpty({ message: 'Tên năm học là bắt buộc' })
  @Length(1, 20)
  tenNamHoc: string;

  @IsNotEmpty({ message: 'Năm bắt đầu là bắt buộc' })
  @IsInt()
  @Min(1900)
  @Max(2100)
  namBatDau: number;

  @IsNotEmpty({ message: 'Năm kết thúc là bắt buộc' })
  @IsInt()
  @Min(1900)
  @Max(2100)
  namKetThuc: number;
}