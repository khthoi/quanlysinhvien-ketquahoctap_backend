import { IsNotEmpty, IsInt } from 'class-validator';

export class PhanCongMonHocDto {
  @IsNotEmpty({ message: 'giangVienId không được để trống' })
  @IsInt()
  giangVienId: number;

  @IsNotEmpty({ message: 'monHocId không được để trống' })
  @IsInt()
  monHocId: number;
}