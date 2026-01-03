import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class NhapDiemDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(10)
  diemQuaTrinh: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(10)
  diemThanhPhan: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(10)
  diemThi: number;
}