import { IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

export class CreateChiTietMonHocDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  thuTuHocKy: number;

  @IsNotEmpty()
  @IsInt()
  monHocId: number;

  @IsOptional()
  ghiChu?: string;
}